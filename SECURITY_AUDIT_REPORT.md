# ShieldGram Security & Compliance Audit Report

**Date:** January 19, 2026  
**Auditor:** OpenCode  
**Scope:** Frontend (Next.js) + Backend (AWS Lambda)  

---

## Executive Summary

This report documents a comprehensive security and compliance review of ShieldGram, an Instagram comment moderation SaaS application with 4 paid subscription tiers managed through Razorpay Subscriptions.

**Overall Security Posture:** **MEDIUM RISK**

Core payment flows are secure with proper signature verification, but Meta webhook forgery vulnerability and missing webhook idempotency are exploitable attack vectors.

---

## 1. Architecture Overview

| Component | Technology | Location |
|-----------|------------|----------|
| Frontend | Next.js | `shieldgram-frontend/` |
| Payments Lambda | Python | `payments/lambda_function.py` |
| Dashboard API Lambda | Python | `dashboard-api/lambda_function.py` |
| Webhook Handler Lambda | Python | `instagram-webhook/lambda_function.py` |
| Database | DynamoDB | `user_info`, `account_info`, `user_usage_info` |
| Authentication | AWS Cognito | `us-east-1_ZzzjCk0xy` |
| Payments | Razorpay | Live keys configured |

---

## 2. Business Rules Compliance Matrix

| # | Rule | Frontend | Backend | Status |
|---|------|----------|---------|--------|
| 1 | 4 tiers (Standard, Plus, Pro, Max) | ✅ `plans.json` | ✅ `plans.json` with type field | **PASS** |
| 2 | No upgrade/downgrade while active | ⚠️ UI blocks only | ✅ `handlers.py:251-264` blocks downgrades, upgrades allowed | **PARTIAL** |
| 3 | Cancelled keeps access until period end | ✅ Client checks `current_end` | ✅ `db_utils.py:183-188` checks `current_end` | **PASS** |
| 4 | Supersede cancelled with new plan | ✅ UI allows | ✅ `handlers.py:66-84` handles `start_at` scheduling | **PASS** |
| 5 | 7-day trial ONLY for Standard/Pro | ✅ Modal filters | ✅ `handlers.py:215-218` validates server-side | **PASS** |
| 6 | Trial not grantable by client tampering | ⚠️ Client sends plan_type | ✅ Server validates `plan_type in ['standard', 'pro']` | **PASS** |
| 7 | Access based on payment, not status | ⚠️ Client checks status | ✅ `check_subscription_access()` multi-factor check | **PASS** |
| 8 | AUTHENTICATED/PENDING = no access | ✅ `hasPageAccess` false | ✅ `db_utils.py:227-229` returns `False` | **PASS** |
| 9 | `current_end` only on payment success | N/A | ✅ `db_utils.py:169-191` only `subscription.charged` updates | **PASS** |

---

## 3. Security Findings

### 3.1 CRITICAL Issues

| ID | Finding | Location | Risk |
|----|---------|----------|------|
| C1 | **Meta webhook signature verification disabled** | `instagram-webhook/lambda_function.py:225-228` | Attackers can forge Instagram webhook events |
| C2 | **Razorpay webhook rejects if secret missing, but no idempotency** | `lambda_function.py:47-61` | Replay attacks possible; duplicate event processing |

#### C1 Details
Lines 225-228 show signature verification is commented out:
```python
# Uncomment to enable Meta signature verification:
# if not verify_meta_signature(raw_body, meta_signature):
#     print(f"Invalid Meta signature: {meta_signature}")
#     return _resp(401, "Invalid signature")
```

**Impact:** An attacker can send forged webhook payloads pretending to be Instagram, potentially:
- Injecting malicious comment data
- Triggering deauthorization flows
- Manipulating account states

#### C2 Details
No `event_id` deduplication exists. The same webhook event can be processed multiple times if Razorpay retries delivery or if an attacker replays a captured webhook.

**Impact:**
- Duplicate subscription activations/cancellations
- Potential billing inconsistencies
- State corruption in user records

---

### 3.2 HIGH Issues

| ID | Finding | Location | Risk |
|----|---------|----------|------|
| H1 | **updateSubscription allows upgrades while active** | `payments/handlers.py:236-305` | Users can upgrade mid-cycle (may be intentional but violates stated rule) |
| H2 | **Plan change blocking only prevents downgrades** | `handlers.py:251-264` | Upgrade path exists via API even if UI blocks |
| H3 | **No rate limiting on trial starts** | `payments/handlers.py:209-233` | User could potentially start multiple trials across accounts |
| H4 | **User-level cache never expires** | `db_utils.py:9-11` (all Lambdas) | Stale subscription status served during Lambda warm instances |

#### H1/H2 Details
The stated business rule is "no upgrade/downgrade while active" but the code only blocks downgrades:

```python
# payments/handlers.py:251-264
if new_weight < current_weight:
    return {
        'statusCode': 400, 
        'body': json.dumps({
            'error': 'Downgrades not permitted via direct update',
            'message': 'Please cancel your current subscription and wait for it to end before downgrading.'
        })
    }
# NO CHECK FOR UPGRADES - they are allowed through
```

#### H4 Details
All Lambda functions use in-memory caches:
```python
PLAN_CACHE = {}  # user_id -> plan_type
USER_STATUS_CACHE = {}  # user_id -> (status, current_end, ...)
```

These caches have no TTL or expiration. During Lambda warm starts, stale data may be served, potentially granting access to users whose subscriptions have since been cancelled or blocked.

---

### 3.3 MEDIUM Issues

| ID | Finding | Location | Risk |
|----|---------|----------|------|
| M1 | **Trial history not checked** | `payments/db_utils.py:43-65` | `if_not_exists(created_at)` prevents re-trial on same user, but deleting user record resets this |
| M2 | **CORS allows all origins** | `payments/lambda_function.py:26-30` | `Access-Control-Allow-Origin: *` |
| M3 | **Razorpay plan map relies on env vars** | `instagram-webhook/config.py:34-38` | Misconfigured env = wrong plan assigned |
| M4 | **GSI fallback to table scan** | `dashboard-api/db_utils.py:286-290` | If GSI fails, full table scan impacts performance |

#### M1 Details
The `start_free_trial` function uses:
```python
UpdateExpression="SET plan_type = :pt, created_at = if_not_exists(created_at, :ca)"
```

This only prevents re-setting `created_at` if it already exists. It does NOT check:
- If user already completed a trial
- If user previously had a paid subscription

If a user's `user_info` record is deleted (e.g., through account deletion), they could start another trial.

#### M2 Details
```python
response['headers'].update({
    'Access-Control-Allow-Origin': '*',  # Too permissive
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
})
```

---

### 3.4 LOW Issues

| ID | Finding | Location | Risk |
|----|---------|----------|------|
| L1 | **Verbose error logging** | All handlers | Internal details in CloudWatch (not exposed to client) |
| L2 | **Default plan fallback to 'standard'** | `plans.py:150` | If plan_id lookup fails, defaults to standard |
| L3 | **No request signing between Lambdas** | Internal SQS calls | SQS IAM roles provide security but no message integrity check |

---

## 4. Entitlement/Access Control Analysis

### 4.1 Server-Side Access Check (Instagram Webhook)

**Location:** `instagram-webhook/lambda_function.py:284-298`

```python
is_active = (status == "active")

if not is_active:
    if plan_type.startswith("trial_"):
        # 7 days trial check
        if current_time < (created_at + 7 * 24 * 60 * 60):
            is_active = True
    elif current_time < current_end or current_time < next_billing:
        is_active = True
    elif plan_type and not sub_id:
        is_active = True  # Legacy user

if not is_active:
    print(f"REJECTED: User {uid} status is {status}")
    continue
```

**Assessment:** ✅ Correctly implements multi-factor access control

### 4.2 Dashboard API Access Check

**Location:** `dashboard-api/handlers.py` (multiple endpoints)

```python
has_access, plan_type, status, details = db_utils.check_subscription_access(user_id)
if not has_access:
    return {'statusCode': 402, 'body': json.dumps({'error': 'Subscription Required', 'status': status})}
```

**Assessment:** ✅ All protected endpoints call `check_subscription_access()`

### 4.3 Payments API Authentication

**Location:** `payments/lambda_function.py:53-58`

```python
if not user_id:
    return add_cors_headers({
        'statusCode': 401,
        'body': json.dumps({'error': 'Unauthorized: No valid user ID found'})
    })
```

**Assessment:** ✅ All endpoints except `/plans` require Cognito authentication

---

## 5. Razorpay Webhook Security Analysis

### 5.1 Signature Verification ✅

**Location:** `instagram-webhook/lambda_function.py:47-61`

```python
def verify_razorpay_signature(payload_str, signature_header):
    if not RAZORPAY_WEBHOOK_SECRET:
        print("ERROR: RAZORPAY_WEBHOOK_SECRET not set, rejecting webhook")
        return False  # GOOD: Rejects if no secret configured
    if not signature_header:
        return False
    
    expected_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature_header)  # GOOD: Timing-safe comparison
```

**Assessment:** ✅ Properly implemented with timing-safe comparison

### 5.2 Missing: Event Idempotency ❌

No deduplication mechanism exists for webhook events. Razorpay includes an `event_id` in every webhook payload that should be used for deduplication.

**Recommended Fix:**
```python
async def handle_razorpay_webhook(payload: dict):
    event_id = payload.get("event_id")
    
    # Check if already processed
    if await is_event_processed(event_id):
        print(f"Skipping duplicate event: {event_id}")
        return _resp(200, "Already processed")
    
    # Process the event...
    
    # Mark as processed with 24-hour TTL
    await mark_event_processed(event_id, ttl_hours=24)
```

---

## 6. Trial Security Analysis

### 6.1 Server-Side Plan Validation ✅

**Location:** `payments/handlers.py:215-218`

```python
if plan_type not in ['standard', 'pro']:
    return {
        'statusCode': 400,
        'body': json.dumps({'error': 'Free trial only available for Standard and Pro plans'})
    }
```

**Assessment:** ✅ Client cannot tamper with plan_type to get Plus/Max trials

### 6.2 Trial Re-use Prevention ⚠️

**Location:** `payments/db_utils.py:52-58`

```python
user_info_table.update_item(
    Key={'user_id': user_id},
    UpdateExpression="SET plan_type = :pt, created_at = if_not_exists(created_at, :ca)",
    ExpressionAttributeValues={
        ':pt': trial_plan,
        ':ca': now
    }
)
```

**Issue:** This only prevents overwriting `created_at` if it exists. It does not check:
1. If user has `trial_used = true` flag
2. If user previously had a paid subscription (`razorpay_subscription_id` exists)

**Recommended Fix:**
```python
def start_free_trial(user_id, plan_type):
    # First check if trial already used
    response = user_info_table.get_item(Key={'user_id': user_id})
    item = response.get('Item', {})
    
    if item.get('trial_used'):
        raise Exception("Trial already used")
    
    if item.get('razorpay_subscription_id'):
        raise Exception("Cannot start trial with existing subscription")
    
    # Proceed with trial...
    user_info_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression="SET plan_type = :pt, created_at = if_not_exists(created_at, :ca), trial_used = :tu",
        ExpressionAttributeValues={
            ':pt': trial_plan,
            ':ca': now,
            ':tu': True
        }
    )
```

---

## 7. Database Schema (Inferred from Code)

### 7.1 user_info Table

| Field | Type | Purpose |
|-------|------|---------|
| `user_id` (PK) | String | Cognito sub ID |
| `plan_type` | String | standard/plus/pro/max/trial_standard/trial_pro |
| `status` | String | active/cancelled/halted/pending/authenticated/payment_failed/disputed/refunded |
| `razorpay_subscription_id` | String | Razorpay subscription ID |
| `razorpay_plan_id` | String | Razorpay plan ID |
| `current_end` | Number | Unix timestamp - current billing period end |
| `next_billing_date` | Number | Unix timestamp - next charge date |
| `created_at` | Number | Unix timestamp - user creation (used for trial expiry) |
| `currency` | String | INR/USD |
| `next_plan_id` | String | Pending downgrade plan ID |
| `downgrade_date` | Number | When downgrade takes effect |
| `last_payment_error` | String | Most recent payment failure reason |
| `dispute_reason` | String | Chargeback reason if disputed |

**GSI:** `razorpay_subscription_id-index` - Used for webhook user lookup

### 7.2 account_info Table

| Field | Type | Purpose |
|-------|------|---------|
| `account_id` (PK) | String | Instagram user ID |
| `owner_user_id` (SK) | String | Cognito user ID |
| `account_name` | String | Instagram username |
| `api_token` | String | Encrypted Instagram access token |
| `plan_type` | String | Inherited from user |
| `policies` | String | Comma-separated policy list |
| `custom_policy` | String | Custom instructions |
| `confidence_threshold` | Number | AI confidence threshold |
| `profile_picture_url` | String | Instagram profile picture |
| `is_deleted` | Boolean | Soft delete flag |
| `is_deauthorized` | Boolean | User removed app from Instagram |

**GSI:** `owner_user_id-index` - Used for fetching all user accounts

---

## 8. Recommended Fixes

### P0 - Critical (Fix Immediately)

| # | Fix | Effort |
|---|-----|--------|
| 1 | **Enable Meta signature verification** - Uncomment lines 225-228 in `instagram-webhook/lambda_function.py` | 5 min |
| 2 | **Add webhook event idempotency** - Create `processed_events` DynamoDB table with TTL, check `event_id` before processing | 2 hrs |

### P1 - High (Fix This Sprint)

| # | Fix | Effort |
|---|-----|--------|
| 3 | **Block upgrades while active** OR **update business rule documentation** to clarify upgrades are allowed | 30 min |
| 4 | **Add `trial_used` flag** to prevent trial re-use after account deletion | 1 hr |
| 5 | **Add cache TTL or invalidation** - Clear caches on subscription status changes | 2 hrs |

### P2 - Medium (Fix Next Sprint)

| # | Fix | Effort |
|---|-----|--------|
| 6 | **Restrict CORS** to `https://shieldgram.com` and staging domains | 15 min |
| 7 | **Add plan_id validation** - Verify plan_id exists in plans.json before creating subscription | 30 min |
| 8 | **Log event_id** for all webhook events for audit trail | 30 min |

### P3 - Low (Backlog)

| # | Fix | Effort |
|---|-----|--------|
| 9 | **Add X-Ray tracing** for request correlation | 2 hrs |
| 10 | **Add CloudWatch alarms** for failed signature verifications | 1 hr |

---

## 9. Required Test Cases

### 9.1 Trial Tests

| Test | Expected Result | Priority |
|------|-----------------|----------|
| POST `/start-free-trial` with `plan_type=plus` | 400 error | P0 |
| POST `/start-free-trial` with `plan_type=max` | 400 error | P0 |
| POST `/start-free-trial` for user with `trial_used=true` | 400 error (currently may allow) | P1 |
| POST `/start-free-trial` for user with existing subscription | 400 error | P1 |

### 9.2 Subscription Tests

| Test | Expected Result | Priority |
|------|-----------------|----------|
| POST `/create-subscription` while `status=active` | 400 error | P0 |
| POST `/update-subscription` to downgrade | 400 error | P0 |
| POST `/update-subscription` to upgrade while active | 400 error (currently 200) | P1 |
| POST `/cancel-subscription` then resubscribe same plan | 200 with `start_at` scheduling | P1 |

### 9.3 Webhook Tests

| Test | Expected Result | Priority |
|------|-----------------|----------|
| Razorpay webhook with invalid signature | 401 error | P0 |
| Razorpay webhook with same `event_id` twice | Process once only (currently processes twice) | P0 |
| Meta webhook with invalid signature | 401 error (currently 200) | P0 |
| Meta webhook with valid signature | 200 success | P0 |

### 9.4 Access Control Tests

| Test | Expected Result | Priority |
|------|-----------------|----------|
| GET `/dashboard-info` with `status=pending` | 402 error | P0 |
| GET `/dashboard-info` with `status=authenticated` | 402 error | P0 |
| GET `/dashboard-info` with `status=cancelled`, `current_end > now` | 200 success | P0 |
| GET `/dashboard-info` with `status=cancelled`, `current_end < now` | 402 error | P0 |
| GET `/dashboard-info` with `status=halted` | 402 error | P0 |
| GET `/dashboard-info` with trial, 6 days old | 200 success | P1 |
| GET `/dashboard-info` with trial, 8 days old | 402 error | P1 |

---

## 10. Summary

| Category | Status | Notes |
|----------|--------|-------|
| 4-tier structure | ✅ Compliant | plans.json defines all tiers correctly |
| Trial restrictions (Standard/Pro only) | ✅ Compliant | Server-side validation in place |
| Cancelled grace period | ✅ Compliant | `current_end` checked server-side |
| Server-side access control | ✅ Implemented | All protected endpoints check subscription |
| Razorpay signature verification | ✅ Implemented | Timing-safe HMAC comparison |
| Meta signature verification | ❌ Disabled | Critical vulnerability |
| Webhook idempotency | ❌ Missing | Replay attacks possible |
| Plan change blocking | ⚠️ Partial | Only downgrades blocked |
| Trial re-use prevention | ⚠️ Weak | No `trial_used` flag |
| CORS configuration | ⚠️ Permissive | Allows all origins |

---

## Appendix A: Files Reviewed

### Frontend
- `shieldgram-frontend/components/Dashboard.tsx` (2811 lines)
- `shieldgram-frontend/services/dashboardService.ts` (691 lines)
- `shieldgram-frontend/middleware.ts`
- `shieldgram-frontend/utils/auth.ts`
- `shieldgram-frontend/app/dashboard/page.tsx`

### Backend
- `payments/lambda_function.py` (92 lines)
- `payments/handlers.py` (500 lines)
- `payments/db_utils.py` (314 lines)
- `payments/plans.py` (508 lines)
- `payments/plans.json` (71 lines)
- `payments/config.py` (17 lines)
- `instagram-webhook/lambda_function.py` (334 lines)
- `instagram-webhook/db_utils.py` (422 lines)
- `instagram-webhook/config.py` (41 lines)
- `dashboard-api/lambda_function.py` (67 lines)
- `dashboard-api/handlers.py` (414 lines)
- `dashboard-api/db_utils.py` (545 lines)
- `dashboard-api/config.py` (27 lines)

---

*Report generated by OpenCode Security Audit*
