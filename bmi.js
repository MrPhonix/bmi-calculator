// Calculate BMI
document.getElementById("calculateBtn").addEventListener("click", () => {
    const height = parseFloat(document.getElementById("height").value);
    const weight = parseFloat(document.getElementById("weight").value);
    
    if (!height || !weight) {
      alert("Please enter height and weight!");
      return;
    }
  
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    const resultDiv = document.getElementById("result");
    
    // Display BMI
    resultDiv.innerHTML = `Your BMI: <strong>${bmi}</strong>`;
    
    // Save to Firestore
    const user = auth.currentUser;
    if (user) {
      db.collection("users").doc(user.uid).collection("bmiHistory").add({
        bmi: bmi,
        height: height,
        weight: weight,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => loadBmiHistory(user.uid)); // Refresh history
    }
  });
  
  // Load BMI History
  function loadBmiHistory(userId) {
    const historyList = document.getElementById("bmiHistory");
    historyList.innerHTML = ""; // Clear previous entries
  
    db.collection("users").doc(userId).collection("bmiHistory")
      .orderBy("timestamp", "desc")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          historyList.innerHTML += `
            <li>
              ${data.timestamp?.toDate().toLocaleDateString()}: 
              BMI ${data.bmi} (${data.height}cm, ${data.weight}kg)
            </li>
          `;
        });
      });
  }
  
  // Clear inputs
  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("height").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("result").innerHTML = "";
  });