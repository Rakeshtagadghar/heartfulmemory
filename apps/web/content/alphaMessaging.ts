export const alphaMessaging = {
  alphaBadge: "Early Alpha",
  alphaBlurbShort:
    "Early Alpha - features may change. Your feedback helps us improve.",
  alphaInfoTitle: "What does Early Alpha mean?",
  alphaInfoBody: [
    "Some features are still being refined.",
    "You might see rough edges or changes.",
    "Your feedback is valuable and helps shape the product.",
    "During alpha, payments run in sandbox/test mode - no real money is taken.",
  ],
  alphaInfoLinkLabel: "What does this mean?",
  sandboxHeadline: "SANDBOX / TEST MODE",
  sandboxSubheadline: "No real money will be taken.",
  sandboxGuidance: "Use a Stripe test card to complete checkout.",
  sandboxFaqQuestion: "Are payments real?",
  sandboxFaqAnswer:
    "During alpha, payments run in sandbox/test mode - no real money is taken.",
  alphaFaqQuestion: "Is Memorioso in Early Alpha?",
  alphaFaqAnswer:
    "Yes - we are in Early Alpha. Some features may change as we learn from early users. Your feedback helps us improve.",
  testCard: {
    number: "4242 4242 4242 4242",
    expiryExample: "12/34 (any future date)",
    cvc: "Any 3 digits",
    postcode: "Any",
  },
} as const;

