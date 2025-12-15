// app/lib/payments.js

export async function createOrder(amount) {
  try {
    const res = await fetch("http://localhost:3000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay wants paise
        currency: "INR",
        receipt: "rcpt_" + Date.now()
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error("Order creation failed: " + JSON.stringify(data.error));
    }

    return data.order;
  } catch (err) {
    console.error("[createOrder] Error:", err);
    throw err;
  }
}
