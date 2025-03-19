document.addEventListener('DOMContentLoaded', async () => {
  try {
    showLoading();
    const orderId = document.getElementById('orderId')?.value;
    if (!orderId) {
      throw new Error('Order ID not found');
    }

    // Use the correct endpoint URL
    const response = await fetch(`/order/${orderId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }

    if (!data.success || !data.order) {
      throw new Error('Order data not found');
    }

    // Validate required order data before updating UI
    if (!data.order.totalAmount) {
      throw new Error('Invalid order amount');
    }

    // Update order details in the DOM
    updateOrderDetails(data.order);
    hideLoading();

    // Add retry payment button event listener
    const retryButton = document.getElementById('retryPaymentButton');
    if (retryButton && data.order.paymentStatus !== 'completed') {
      retryButton.addEventListener('click', () => handleRetryPayment(data.order));
    } else if (retryButton) {
      retryButton.style.display = 'none'; // Hide button if payment is completed
    }
  } catch (error) {
    hideLoading();
    console.error('Error fetching order details:', error);
    showError(error.message);
  }
});

function updateOrderDetails(order) {
  try {
    if (!order || typeof order !== 'object') {
      throw new Error('Invalid order data');
    }

    // Update order ID
    const orderIdElement = document.getElementById('displayOrderId');
    if (orderIdElement) {
      orderIdElement.textContent = order._id || 'N/A';
    }

    // Update order status
    const statusElement = document.getElementById('orderStatus');
    if (statusElement) {
      const status = order.orderStatus || order.status || 'Pending';
      statusElement.textContent = status;
      statusElement.className = `status ${status.toLowerCase()}`;
    }

    // Update payment status
    const paymentStatusElement = document.getElementById('paymentStatus');
    if (paymentStatusElement) {
      const paymentStatus = order.paymentStatus || 'Pending';
      paymentStatusElement.textContent = paymentStatus;
      paymentStatusElement.className = `status ${paymentStatus.toLowerCase()}`;
    }

    // Update total amount with validation
    const totalElement = document.getElementById('totalAmount');
    if (totalElement) {
      const amount = parseFloat(order.totalAmount) || 0;
      totalElement.textContent = formatCurrency(amount);
    }

    // Update items list with validation
    const itemsContainer = document.getElementById('orderItems');
    if (itemsContainer && Array.isArray(order.items)) {
      const itemsHtml = order.items.map(item => {
        if (!item) return '';
        
        const product = item.productId || {};
        const price = parseFloat(item.price || product.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const subtotal = price * quantity;

        return `
          <div class="order-item">
            <div class="item-details">
              <img src="${product.image || '/images/placeholder.jpg'}" 
                   alt="${product.name || 'Product'}" 
                   class="item-image">
              <div class="item-info">
                <h4>${product.name || 'Product Name'}</h4>
                <p>Quantity: ${quantity}</p>
                <p>Price: ${formatCurrency(price)}</p>
                <p>Subtotal: ${formatCurrency(subtotal)}</p>
              </div>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      itemsContainer.innerHTML = itemsHtml || '<p>No items found</p>';
    }

    // Update shipping address with validation
    const addressElement = document.getElementById('shippingAddress');
    if (addressElement && order.billingAddress) {
      const address = order.billingAddress;
      addressElement.innerHTML = `
        <p>${address.name || ''}</p>
        <p>${address.street || ''}</p>
        <p>${address.city || ''}, ${address.state || ''}</p>
        <p>${address.postcode || ''}</p>
        <p>${address.country || ''}</p>
        <p>Phone: ${address.phone || ''}</p>
      `;
    } else if (addressElement) {
      addressElement.innerHTML = '<p>No address information available</p>';
    }

    // Update order dates with validation
    const orderDateElement = document.getElementById('orderDate');
    if (orderDateElement && order.createdAt) {
      try {
        const date = new Date(order.createdAt);
        orderDateElement.textContent = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        orderDateElement.textContent = 'Date not available';
      }
    }

  } catch (error) {
    console.error('Error updating order details:', error);
    showError('Failed to display order details');
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff5252;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-overlay';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  loadingDiv.innerHTML = `
    <div class="loading-spinner">
      <div style="
        width: 50px;
        height: 50px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loadingDiv = document.getElementById('loading-overlay');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Add this to your CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

async function handleRetryPayment(order) {
  try {
    if (!order || !order.totalAmount) {
      throw new Error('Invalid order amount');
    }

    showLoading();
    
    // Initialize Razorpay payment
    const response = await fetch('/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        amount: order.totalAmount,
        orderId: order._id 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }

    const { order: razorpayOrder } = await response.json();

    const options = {
      key: 'rzp_test_tiBBaN9rBkAr9r',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Your Store Name',
      description: `Payment for Order ${order._id}`,
      order_id: razorpayOrder.id,
      handler: async function (response) {
        try {
          showLoading();
          
          // Verify payment
          const verificationResult = await fetch('/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order._id
            })
          });

          if (!verificationResult.ok) {
            throw new Error('Payment verification failed');
          }

          const result = await verificationResult.json();
          
          if (result.success) {
            // Update order status using the existing endpoint
            const updateResult = await fetch(`/admin/update-product-status/${order._id}/${order.items[0]._id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                status: order.status || 'Processing',
                paymentStatus: 'completed'
              })
            });

            if (!updateResult.ok) {
              const errorData = await updateResult.json();
              throw new Error(errorData.message || 'Failed to update payment status');
            }

            showSuccess('Payment successful! Order status updated.');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            throw new Error(result.message || 'Payment verification failed');
          }
        } catch (error) {
          showError('Payment verification failed: ' + error.message);
        } finally {
          hideLoading();
        }
      },
      prefill: {
        name: order.billingAddress?.name || '',
        email: order.customerId?.email || '',
        contact: order.billingAddress?.phone || ''
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
    hideLoading();
  } catch (error) {
    hideLoading();
    showError('Failed to initialize payment: ' + error.message);
  }
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 5000);
} 