# Lovable → Aditunis UI integration

## Source

Lovable project: `42e916c5-9234-4c93-be4a-28f4364094c1`.

This integration is an adapted source pull, not evidence that every Lovable feature is live in Aditunis. The initial slice deliberately imports the communication-board interaction model, phrase vocabulary, switch-scanning concept, and visual language while keeping Aditunis foundation services authoritative.

## Imported in this slice

- large category-based AAC phrase tiles;
- participant-controlled immediate speech for directly selected phrases;
- sentence-building/staging tray;
- handoff from the board into the Aditunis composer;
- switch-scanning mode with pause, step, and activate controls;
- Lovable-derived calm teal/amber visual tokens and category styling;
- emergency-category communication phrases with an explicit non-calling notice.

## Aditunis authority boundaries

- Model-generated `CommunicationHypothesis` objects still require provenance and explicit participant confirmation before speech.
- Board tiles are direct participant selections, not model inference. A deliberate tile activation may therefore speak immediately.
- A sentence sent from the board to the composer is deliberately unconfirmed until the participant presses Confirm.
- Personal VAD remains optional and fail-open for communication access; it is not authentication.
- Twilio code remains a local/protocol test boundary. The Lovable emergency UI does not create a live PSTN or emergency-call path.
- Temporal remains responsible for durable model-lifecycle consent/withdrawal orchestration.

## Not imported yet

The first slice does **not** import Lovable Supabase credentials/configuration, cloud authentication, MCP edge functions, AI rephrasing services, medical information storage, caregiver/supporter data, nearby/location features, or automated emergency behaviour. Those need separate privacy, consent, security, and service-boundary review before adoption.

## Accessibility acceptance criteria

- WCAG 2.2 AA remains the minimum target.
- All phrase/category/build controls are keyboard operable.
- Minimum control target remains at least 44×44 CSS pixels, with larger AAC tiles preferred.
- Focus is visibly indicated.
- Switch scanning never removes ordinary keyboard/touch access.
- Reduced-motion preferences suppress nonessential movement.
- Status changes are announced with live regions without stealing focus.

## Next integration slices

1. Import Lovable onboarding/accessibility preferences into a typed Aditunis communication profile.
2. Port quick phrases/favourites and user-controlled custom tiles without introducing cloud persistence by default.
3. Reconcile Lovable's `SpeakButton`/speech preferences with the Aditunis `SpeechOutputAdapter` contract.
4. Evaluate supporter mode and profile storage against MapAble Core consent/delegation boundaries.
5. Review each AI/cloud feature independently before connecting it to Aditunis adapters.
