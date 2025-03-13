

document.addEventListener("DOMContentLoaded", function () {
    const orderId = document.getElementById("razorId").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const paymentStatus =  document.getElementById("paymentStatus").value;

    if (paymentMethod === "razorpay" && paymentStatus === "Pending") {
        document.getElementById("retryPaymentButton").style.display = "block";
        document.getElementById("retryPaymentMessage").style.display = "block";
    }

    document.getElementById("retryPaymentButton").addEventListener("click", function () {
        fetch("/get-order-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: orderId })
        })
        .then(response => response.json())
        .then(orderData => {

            console.log("orderData",orderData);
            
            const options = {
                key: orderData.key,
                amount: orderData.order.amount,
                currency: "INR",
                name: "Clicon",
                description: "Retry Your Payment",
                order_id: orderId, 
                handler: function (response) {
                    fetch("/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId: orderId,
                            paymentId: response.razorpay_payment_id
                        }),
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: "Payment Successful!",
                                text: "Your order is now paid.",
                                icon: "success",
                                confirmButtonText: "OK"
                            }).then(() => {
                                location.reload(); 
                            });
                        } else {
                            Swal.fire({
                                title: "Payment Verification Failed",
                                text: "Please try again.",
                                icon: "error",
                                confirmButtonText: "OK"
                            });
                        }
                    });
                },
                modal: {
                    escape: false,
                    closed: function () {
                        Swal.fire({
                            title: "Payment Not Completed",
                            text: "You can retry payment anytime.",
                            icon: "info",
                            confirmButtonText: "OK"
                        });
                    }
                },
                theme: { color: "#3399cc" }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        })
        .catch(error => console.error("Error fetching order details:", error));
    });
});



   
   function confirmCancel(orderId, productId ,quantity) {
    
        Swal.fire({
    title: "Are you sure?",
    html: `
        <p>You are about to cancel this order.</p>
        <p>Please select a reason for cancellation:</p>
        <div style="text-align: left; margin-top:50px;">
            <input type="radio" name="cancelReason" value="Color Issue" id="colorIssue">
            <label for="colorIssue">Color Issue</label><br>
            <input type="radio" name="cancelReason" value="Damage" id="damage">
            <label for="damage">Damage</label><br>
            <input type="radio" name="cancelReason" value="Other" id="other">
            <label for="other">Other</label><br>
        </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it!",
    preConfirm: () => {
        const selectedReason = document.querySelector('input[name="cancelReason"]:checked');
        if (!selectedReason) {
            Swal.showValidationMessage("Please select a cancellation reason");
            return false;
        }
        return selectedReason.value;
    }
}).then((result) => {
    if (result.isConfirmed) {
        const cancelReason = result.value;
        window.location.href = `/update-order-status?orderId=${orderId}&productId=${productId}&newStatus=Cancelled&quantity=${quantity}&reason=${encodeURIComponent(cancelReason)}`;
    }
});
    }  
    
    function downloadInvoice(button) {
    const orderData = JSON.parse(button.dataset.order);
    const doc = new jsPDF();

    // Set document properties¹
    doc.setProperties({
        title: `Invoice-${orderData.customOrderId}`,
        subject: 'Clicon Store Invoice',
        author: 'Clicon Store',
        keywords: 'invoice, order, purchase'
    });

    // Simple white background²
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Simple header³
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 20, 'F');
    
    // Title⁴
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("INVOICE", 105, 14, { align: "center" });
    
    // Reset text color⁵
    doc.setTextColor(0, 0, 0);

    // Company info⁶
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Clicon Store", 15, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Main Street, Kerala, India", 15, 36);
    
    // Invoice info⁷
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Number:", 140, 30);
    doc.setFont("helvetica", "normal");
    doc.text(`INV-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`, 180, 30);
    
    doc.setFont("helvetica", "bold");
    doc.text("Date:", 140, 36);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(orderData.orderDate).toLocaleDateString(), 180, 36);
    
    doc.setFont("helvetica", "bold");
    doc.text("Payment Method:", 140, 42);
    doc.setFont("helvetica", "normal");
    doc.text(orderData.paymentMethod, 180, 42);

    // Separator line⁸
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 48, 195, 48);

    // Customer info⁹
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Bill To:", 15, 58);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${orderData.billingAddress?.name || ''}`, 15, 65);
    doc.text(`${orderData.billingAddress?.street || ''}`, 15, 71);
    doc.text(`${orderData.billingAddress?.city || ''}, ${orderData.billingAddress?.state || ''}`, 15, 77);
    doc.text(`${orderData.billingAddress?.postcode || ''}`, 15, 83);
    doc.text(`${orderData.billingAddress?.country || 'India'}`, 15, 89);
    doc.text(`Phone: ${orderData.billingAddress?.phone || ''}`, 15, 95);
    doc.text(`Email: ${orderData.billingAddress?.email || ''}`, 15, 101);

    // Separator line¹⁰
    doc.line(15, 108, 195, 108);

    // Table Headers¹¹
    let startY = 118;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY - 6, 180, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("Product", 20, startY);
    doc.text("Qty", 100, startY);
    doc.text("Price", 120, startY);
    doc.text("Discount", 145, startY);
    doc.text("Total", 175, startY);
    
    // Table content¹²
    doc.setFont("helvetica", "normal");
    let y = startY + 10;
    let subtotal = 0;

    orderData.items.forEach((item) => {
        const unitPrice = Math.floor(parseFloat(item.price)) || 0;
        const discount = item.offer ? parseFloat(item.offer) : 0;
        const discountAmount = Math.floor((unitPrice * discount) / 100);
        const netPrice = Math.floor(unitPrice - discountAmount);
        const total = Math.floor(netPrice * parseInt(item.quantity));
        subtotal += total;

        // Table Data¹³
        doc.text(item.productName || '', 20, y, { maxWidth: 75 });
        doc.text(item.quantity.toString(), 100, y);
        doc.text("₹" + unitPrice.toString(), 120, y);
        doc.text(Math.floor(discount).toString() + "%", 145, y);
        doc.text("₹" + total.toString(), 175, y);

        y += 10;
        
        // Add line between items¹⁴
        doc.setDrawColor(230, 230, 230);
        doc.line(15, y - 5, 195, y - 5);
    });

    // Total Section¹⁵
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 140, y);
    doc.text("₹" + Math.floor(subtotal).toString(), 175, y);

    // Footer¹⁶
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(15, y + 15, 195, y + 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("This is a computer-generated invoice. No signature required.", 105, y + 25, { align: "center" });
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(41, 128, 185);
    doc.text("Thank you for shopping with Clicon Store!", 105, y + 35, { align: "center" });

    // Save PDF¹⁷
    doc.save(`invoice-${orderData.customOrderId}.pdf`);
}

