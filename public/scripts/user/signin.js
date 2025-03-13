

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
 










  let action = "signin";

  window.onload = function () {
    if (action === "signin") {
      google.accounts.id.initialize({
        client_id:"<%= googleClientId %>",
        callback: handleCredentialResponsesingin,
      });
    }

    google.accounts.id.renderButton(
      document.getElementById("google-signin-button"),
      { theme: "outline", size: "large" }
    );
  };

  function handleCredentialResponsesingin(response) {
    const id_token = response.credential;

    const decoded = jwt_decode(id_token);
console.log(decoded)
    const data = { email: decoded.email };

    fetch("/authsignin", {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: { "Content-Type": "application/json" },
    })
      .then((data) => {
        console.log(data)
        if (data.redirected) {
          
          window.location = data.url;
        } 
        if(data.status === 404) {
          document.getElementById("in").innerHTML = "user  not found";
        }
        if(data.status === 401) {
          document.getElementById("in").innerHTML = "user banned by admin please contact him";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
