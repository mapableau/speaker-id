# Aditunis Foundation Privacy Controls

Aditunis is designed around communication authority and data minimisation.

For the foundation release:

- calls are not recorded;
- raw microphone audio and camera video are not persisted;
- live service traffic is not used for model training;
- tests use synthetic data only;
- speaker embeddings are not implemented or stored by this slice;
- future speaker-profile artifacts must be encrypted, purpose-limited and separately deletable;
- Personal VAD is an optional accessibility/noise-control mechanism, not authentication;
- training consent is separate from ordinary communication-service consent;
- withdrawal must delete intentionally collected training samples and derived personal models without deleting unrelated service data;
- ordinary logs must not contain raw communication content;
- credentials are environment configuration only and are never committed;
- emergency calling, medical communication guarantees and interpreter substitution are outside scope.

The participant remains the authority over the message spoken on their behalf. Model output is a hypothesis, not consent and not intent authority.
