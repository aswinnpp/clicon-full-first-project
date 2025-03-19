async function initializeRazorpay(amount) {
  try {
    // Remove commas and convert to number
    const parsedAmount = parseFloat(amount.toString().replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid amount');
    }

    const response = await fetch('/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: parsedAmount })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }

    const { order, amount: amountInPaise } = await response.json();

    const options = {
      key: 'rzp_test_tiBBaN9rBkAr9r',
      amount: amountInPaise,
      currency: 'INR',
      name: 'Your Store Name',
      description: 'Purchase Payment',
      order_id: order.id,
      handler: async function (response) {
        try {
          // Show loading state
          showLoading();
          
          // Verify payment
          const verificationResult = await verifyPayment(response);
          
          if (verificationResult.success) {
            // Set payment details in form
            document.getElementById('razorpay_payment_id').value = response.razorpay_payment_id;
            document.getElementById('razorpay_order_id').value = response.razorpay_order_id;
            document.getElementById('razorpay_signature').value = response.razorpay_signature;
            document.getElementById('paymentStatus').value = 'completed';
            
            // Submit the form
            const form = document.getElementById('checkoutForm');
            if (form) {
              form.submit();
            } else {
              throw new Error('Checkout form not found');
            }
          } else {
            hideLoading();
            showError('Payment verification failed: ' + verificationResult.message);
          }
        } catch (error) {
          hideLoading();
          showError('Payment processing failed: ' + error.message);
          // Redirect to cart or checkout page on failure
          window.location.href = '/cart';
        }
      },
      prefill: {
        name: document.getElementById('name')?.value || '',
        email: document.getElementById('email')?.value || '',
        contact: document.getElementById('phone')?.value || ''
      },
      theme: {
        color: '#3498db'
      },
      modal: {
        ondismiss: function() {
          hideLoading();
          showError('Payment cancelled by user');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    hideLoading();
    showError('Payment initialization failed: ' + error.message);
  }
}

async function verifyPayment(response) {
  try {
    const result = await fetch('/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      })
    });

    if (!result.ok) {
      const error = await result.json();
      throw new Error(error.message || 'Payment verification failed');
    }

    return await result.json();
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

function showError(message) {
  // Create or update error message element
  let errorDiv = document.getElementById('payment-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'payment-error';
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ff5252; color: white; padding: 15px; border-radius: 5px; z-index: 1000; max-width: 300px;';
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showLoading() {
  // Create loading overlay
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'payment-loading';
  loadingDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;';
  loadingDiv.innerHTML = '<div style="background: white; padding: 20px; border-radius: 5px;">Processing payment...</div>';
  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loadingDiv = document.getElementById('payment-loading');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Add event listener to payment button
document.addEventListener('DOMContentLoaded', () => {
  const payButton = document.getElementById('razorpayButton');
  if (payButton) {
    payButton.addEventListener('click', (e) => {
      e.preventDefault();
      const amount = document.getElementById('amount')?.value;
      if (!amount) {
        showError('Amount is required');
        return;
      }
      initializeRazorpay(amount);
    });
  }
}); 