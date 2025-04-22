// Initialize Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDCUFhz6tng4nrfhkAJZUXi8bL1OhiSJEw",
    authDomain: "bmi-calculator-84c8b.firebaseapp.com",
    projectId: "bmi-calculator-84c8b",
    storageBucket: "bmi-calculator-84c8b.firebasestorage.app",
    messagingSenderId: "665702271653",
    appId: "1:665702271653:web:88f915e22c984da1759b4c",
    measurementId: "G-T40B028G7E"
  };
  
  firebase.initializeApp(firebaseConfig);
  const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
  
  // Check login state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is logged in
      document.getElementById("userProfile").classList.remove("hidden");
      document.getElementById("userName").textContent = user.displayName || "User";
      document.getElementById("userEmail").textContent = user.email;
      
      // Load BMI history
      loadBmiHistory(user.uid);
    } else {
      // No user → Redirect to login
      window.location.href = "login.html";
    }
  });
  
  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut();
  });
  auth.signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    console.log("Success! User:", userCredential.user);
  })
  .catch((error) => {
    console.error("Error code:", error.code, "Message:", error.message);
    alert(error.message); // Show exact error to users
  });