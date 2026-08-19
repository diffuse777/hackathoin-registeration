function rupeesToPaise(amountInRupees) {
  return Math.round(Number(amountInRupees) * 100);
}

function paiseToRupees(amountInPaise) {
  return Number(amountInPaise) / 100;
}

module.exports = { rupeesToPaise, paiseToRupees };
