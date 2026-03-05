import { alphaMessaging } from "../../content/alphaMessaging";

export function TestCardHelper() {
  return (
    <div className="mt-3 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm text-white/80">
      <p className="text-sm font-semibold text-parchment">Stripe test card helper</p>
      <ul className="mt-2 space-y-1">
        <li>
          <span className="font-semibold text-white">Card number:</span>{" "}
          {alphaMessaging.testCard.number}
        </li>
        <li>
          <span className="font-semibold text-white">Expiry:</span>{" "}
          {alphaMessaging.testCard.expiryExample}
        </li>
        <li>
          <span className="font-semibold text-white">CVC:</span>{" "}
          {alphaMessaging.testCard.cvc}
        </li>
        <li>
          <span className="font-semibold text-white">Postcode:</span>{" "}
          {alphaMessaging.testCard.postcode}
        </li>
      </ul>
      <a
        href="https://docs.stripe.com/testing?testing-method=card-numbers"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex font-semibold text-gold underline decoration-gold/70 underline-offset-4 hover:text-[#e8cc95]"
      >
        Stripe testing docs
      </a>
    </div>
  );
}

