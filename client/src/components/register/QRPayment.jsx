export function QRPayment({ imageSrc, amountLabel }) {
  if (!imageSrc) {
    return null;
  }

  return (
    <figure className="qr-wrap">
      <img src={imageSrc} alt="Payment QR code" width={280} height={280} />
      {amountLabel ? <figcaption className="visually-hidden">Pay {amountLabel}</figcaption> : null}
    </figure>
  );
}
