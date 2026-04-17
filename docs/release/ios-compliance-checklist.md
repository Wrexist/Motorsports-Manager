# iOS App Store compliance checklist (Pit Lane Manager)

Use this as a release gate before uploading a build to App Store Connect.

## A) Build integrity
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run legal:scan` passes (coarse check for disallowed trademark tokens in `src/` + `index.html`)
- [ ] App launches cold start without blank screen (hydration gate)

## B) Privacy manifest (`PrivacyInfo.xcprivacy`)
> Add this file inside the iOS app target once `ios/` exists (`npx cap add ios` on macOS).

Template in-repo (copy into Xcode target when iOS project exists):
- `docs/release/ios-privacy-manifest.template.xcprivacy`

- [ ] List every **required reason API** category you touch (examples commonly needed: UserDefaults; file timestamps)
- [ ] Each category includes accurate reason codes
- [ ] `NSPrivacyTracking` reflects reality (usually false unless you implemented ATT + tracking)

## C) Info.plist permission strings
Rule: **only** include usage descriptions for permissions you actually request.

Common pitfalls:
- Photo library / camera / microphone strings present but unused → review friction

## D) Account deletion (if applicable)
If the app supports account creation, Apple expects account deletion affordances. For **offline-only** games, ensure you don’t accidentally imply online accounts in UI.

## E) IAP / subscriptions (if enabled)

**v1.0 default for this repo**: ship without in-app purchases first (`TASK.md` scope lock). Keep RevenueCat integration behind a feature flag until you explicitly enable monetization.
- [ ] Restore Purchases visible
- [ ] Subscription terms visible (length/price/what it unlocks)
- [ ] Review notes include sandbox test account + purchase steps
- [ ] No pay-to-win gating (per `CLAUDE.md`)

## F) ATT (App Tracking Transparency)
- [ ] If you don’t need tracking: **do not** link ATT
- [ ] If an ad SDK requires it: pre-permission UX + accurate tracking disclosure

## G) Reviewer notes template (fill in)

### Test account
- Username:
- Password:

### Steps to see core loop
1.
2.
3.

### Known limitations (honesty reduces churn)
-
