


const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('sign-up-password');

  togglePasswordBtn.addEventListener('click', function() {
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'; 
      togglePasswordBtn.textContent = '🙈'; 
    } else {
      passwordInput.type = 'password';  
      togglePasswordBtn.textContent = '👁️';  
    }
  });

  passwordInput.addEventListener('input', function() {

    togglePasswordBtn.disabled = false;
  });
 



  document.addEventListener("DOMContentLoaded", () => {
    const signUpForm = document.querySelector("#sign-up-form"); 
    signUpForm.addEventListener("submit", (event) => {
      event.preventDefault(); 

    
      const name = document.getElementById("sign-up-name").value.trim();
      const email = document.getElementById("sign-up-email").value.trim();
      const password = document.getElementById("sign-up-password").value.trim();
      const confirmPassword = document
        .getElementById("sign-up-confirm-password")
        .value.trim();

      const errorMsg = document.getElementById("error");
      


     
  
      errorMsg.innerHTML = '';
    


      if (name === "") {
        errorMsg.innerHTML="Name is required."
      
        return;
      }
   
      if (email === "") {
        errorMsg.innerHTML="Email is required."
        return;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMsg.innerHTML="Invalid email address."       
        return;
      }

      if (
        password === "" ||
        password.length < 6 ||
        !/(?=.*[a-z])/.test(password) ||
        !/(?=.*[A-Z])/.test(password) ||
        !/(?=.*[0-9])/.test(password) ||
        !/(?=.*[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>\/?])/.test(password)
      ) {
        errorMsg.innerHTML= `Password must contain:<br> 
            -  at least 6 characters long<br>
            - one lowercase letter<br>
            - one uppercase letter<br>
            - one number<br>
            - one special character`
        
        return;
      }

      if (confirmPassword === "") {
        
        errorMsg.innerHTML="Confirm password is required." 

        return;
      } else if (password !== confirmPassword) {
        errorMsg.innerHTML="Passwords do not match." 
        return;
      }

      signUpForm.submit();
    });
  });



  let action = "signup";

  window.onload = function () {
    if (action === "signup") {
      google.accounts.id.initialize({
        client_id:"<%= googleClientId %>" ,
        callback: handleCredentialResponsesingup,
      });
    }

    google.accounts.id.renderButton(
      document.getElementById("google-signup-button"),
      { theme: "outline", size: "large" }
    );
  };


  function handleCredentialResponsesingup(response) {
    console.log("ggggggggggggggg");

    const id_token = response.credential;

    console.log("ID Token: ", id_token);

    const decoded = jwt_decode(id_token);
    console.log("User Profile: ", decoded);
    const data = { name: decoded.name, email: decoded.email, imageUrl: decoded.picture  };

    fetch("/authsignup", {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: { "Content-Type": "application/json" },
    })
      .then((data) => {
        console.log(data);

        if (data.redirected) {
          console.log("hhhhhhhhhhh");

          window.location = data.url;
        } else {
          document.getElementById("error").innerHTML = "useralready exist";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  document.getElementById("useReferral").addEventListener("change", function () {
    let referralInputDiv = document.getElementById("referralInputDiv");
    let referralInput = document.getElementById("sign-up-referral-code");

    if (this.checked) {
      referralInputDiv.style.display = "block"; 
      referralInput.required = true;
    } else {
      referralInputDiv.style.display = "none"; 
      referralInput.required = false;
      referralInput.value = ""; 
    }
  });
