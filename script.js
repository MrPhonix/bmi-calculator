// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCUFhz6tng4nrfhkAJZUXi8bL1OhiSJEw",
  authDomain: "bmi-calculator-84c8b.firebaseapp.com",
  projectId: "bmi-calculator-84c8b",
  storageBucket: "bmi-calculator-84c8b.appspot.com",
  messagingSenderId: "665702271653",
  appId: "1:665702271653:web:88f915e22c984da1759b4c",
  measurementId: "G-T40B028G7E"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===== DARK MODE FUNCTIONS =====
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  } else {
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
  }
  
  darkModeToggle.addEventListener('click', toggleDarkMode);
}

function toggleDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  document.body.classList.toggle('dark-mode');
  const isNowDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isNowDarkMode);
  darkModeToggle.innerHTML = isNowDarkMode 
    ? '<i class="fas fa-sun"></i> Light Mode' 
    : '<i class="fas fa-moon"></i> Dark Mode';
}

// ===== PROFILE FUNCTIONS =====
function updateProfileUI(user) {
  const profileMenu = document.getElementById('profileMenu');
  const loginButton = document.getElementById('loginButton');
  
  profileMenu.classList.remove('hidden');
  loginButton.classList.add('hidden');
  
  // Update all profile images
  const profileImages = document.querySelectorAll('.profile-image');
  profileImages.forEach(img => {
    img.src = user.photoURL || 'default-profile.jpg';
    img.alt = user.displayName || 'User';
  });
  
  // Update user info
  document.getElementById('profileUserName').textContent = user.displayName || 'User';
  document.getElementById('profileUserEmail').textContent = user.email || '';
  document.getElementById('dropdownProfileName').textContent = user.displayName || 'User';
  document.getElementById('welcomeMessage').textContent = `Welcome, ${user.displayName || 'User'}!`;
}

// ===== DROPDOWN TOGGLE FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', () => {
  // Add click event for profile trigger
  const profileTrigger = document.getElementById('profileTrigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent immediate closing
      const profileMenu = document.getElementById('profileMenu');
      profileMenu.classList.toggle('hidden');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const profileMenu = document.getElementById('profileMenu');
    const profileTrigger = document.getElementById('profileTrigger');
    
    if (!profileMenu.contains(e.target) && !profileTrigger.contains(e.target)) {
      profileMenu.classList.add('hidden');
    }
  });
});

// Handle photo upload
document.getElementById('photoUpload')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const user = firebase.auth().currentUser;
    const storageRef = firebase.storage().ref(`profile_photos/${user.uid}`);
    
    storageRef.put(file).then(() => {
      storageRef.getDownloadURL().then(url => {
        // Update profile photo in UI
        const profileImages = document.querySelectorAll('.profile-image');
        profileImages.forEach(img => {
          img.src = url;
        });
        
        // Update user profile in Firebase Auth
        user.updateProfile({
          photoURL: url
        });
        
        // Update in Firestore
        db.collection('users').doc(user.uid).update({
          photoURL: url
        });
      });
    });
  }
});

// Handle edit profile
document.getElementById('editProfileBtn')?.addEventListener('click', function() {
  const user = firebase.auth().currentUser;
  const currentName = user.displayName || 'User';
  const newName = prompt("Enter your new name:", currentName);
  
  if (newName && newName !== currentName) {
    user.updateProfile({
      displayName: newName
    }).then(() => {
      // Update all instances of the user's name
      document.getElementById('profileUserName').textContent = newName;
      document.getElementById('dropdownProfileName').textContent = newName;
      document.getElementById('welcomeMessage').textContent = `Welcome, ${newName}!`;
      
      // Update in Firestore
      db.collection('users').doc(user.uid).update({
        displayName: newName,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).catch(error => {
      console.error("Error updating profile:", error);
    });
  }
});

// ===== AUTH FUNCTIONS =====
firebase.auth().onAuthStateChanged(async user => {
  try {
    if (user) {
      // User is signed in
      updateProfileUI(user);
      
      // Ensure user document exists
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        bmiHistory: firebase.firestore.FieldValue.arrayUnion(...[])
      }, { merge: true });
      
      // Load user data (will handle history migration)
      await loadUserData(user.uid);
    } else {
      // User is signed out
      document.getElementById('profileMenu')?.classList.add('hidden');
      document.getElementById('loginButton')?.classList.remove('hidden');
      document.getElementById('welcomeMessage').textContent = "Welcome, User!";
      document.querySelectorAll('.profile-image').forEach(img => {
        img.src = "default-profile.jpg";
      });
      renderHistory(); // Show local history for guests
    }
  } catch (error) {
    console.error("Auth state change error:", error);
  }
});

// Logout function
document.getElementById('logoutButton')?.addEventListener('click', function() {
  firebase.auth().signOut().then(() => {
    console.log("User signed out");
    // Close the dropdown menu after logout
    document.getElementById('profileMenu').classList.add('hidden');
  }).catch(error => {
    console.error("Sign out error:", error);
  });
});

// ===== BMI CALCULATOR =====
document.getElementById('calculateBMI')?.addEventListener('click', calculateBMI);
document.getElementById('clearForm')?.addEventListener('click', clearForm);

async function calculateBMI() {
  try {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);

    if (!height || !weight) {
      alert("Please enter valid height and weight!");
      return;
    }

    const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
    showBMIResult(bmi);
    
    // Store the result
    const user = firebase.auth().currentUser;
    if (user) {
      await storeBMI(user.uid, bmi);
    } else {
      // Fallback to localStorage for guests
      const date = new Date().toISOString();
      let history = JSON.parse(localStorage.getItem("bmiHistory")) || [];
      history.push({ date, bmi });
      localStorage.setItem("bmiHistory", JSON.stringify(history));
      renderHistory();
    }
  } catch (error) {
    console.error("Error calculating BMI:", error);
    alert("An error occurred while calculating BMI. Please try again.");
  }
}

function showBMIResult(bmi) {
  const resultDiv = document.getElementById('result');
  const categoryDiv = document.getElementById('bmiCategory');
  const adviceDiv = document.getElementById('healthAdvice');
  
  resultDiv.innerHTML = `Your BMI is: <strong>${bmi}</strong>`;
  
  // Determine category
  let category, categoryClass, advice;
  if (bmi < 18.5) {
    category = "Underweight";
    categoryClass = "underweight";
    advice = "Your BMI suggests you're underweight. This may indicate nutritional deficiencies or other health issues. Consider increasing your calorie intake with nutrient-dense foods like nuts, dairy, lean meats, and whole grains. Consult a doctor if you experience fatigue or other symptoms.";
  } else if (bmi < 25) {
    category = "Normal weight";
    categoryClass = "normal";
    advice = "Your BMI is in the healthy range. Maintain your weight with balanced nutrition and regular exercise. Focus on whole foods, vegetables, lean proteins, and healthy fats. Continue monitoring your health with regular check-ups.";
  } else if (bmi < 30) {
    category = "Overweight";
    categoryClass = "overweight";
    advice = "Your BMI suggests you're overweight. Consider gradual weight loss through a balanced diet and increased physical activity. Focus on portion control, reducing processed foods, and incorporating 150+ minutes of exercise weekly. Consult a nutritionist for personalized advice.";
  } else {
    category = "Obese";
    categoryClass = "obese";
    advice = "Your BMI indicates obesity, which increases health risks. Seek medical advice for a supervised weight loss plan. Focus on sustainable lifestyle changes including diet modification and regular exercise. Consider working with a healthcare team including a doctor and dietitian.";
  }
  
  categoryDiv.innerHTML = `Category: <span class="${categoryClass}">${category}</span>`;
  adviceDiv.innerHTML = `<strong>Health Advice:</strong> ${advice}`;
  
  // Show diet and workout plans
  showDietPlan(bmi);
  suggestWorkout(bmi);
}

// ===== DIET & WORKOUT PLANS =====
function showDietPlan(bmi) {
  let dietPlan = "";
  
  if (bmi < 18.5) {
    dietPlan = `
      <h3>Diet Plan for Weight Gain</h3>
      <ul>
        <li><strong>Increase calorie intake</strong> by 300-500 calories/day</li>
        <li><strong>Eat more frequently</strong> - 5-6 small meals/day</li>
        <li><strong>Focus on nutrient-dense foods</strong>: nuts, seeds, avocados, whole grains</li>
        <li><strong>Protein-rich foods</strong>: eggs, chicken, fish, lentils, dairy</li>
        <li><strong>Healthy fats</strong>: olive oil, nut butters, fatty fish</li>
      </ul>
    `;
  } else if (bmi < 25) {
    dietPlan = `
      <h3>Diet Plan for Weight Maintenance</h3>
      <ul>
        <li><strong>Balanced meals</strong> with all food groups</li>
        <li><strong>Portion control</strong> to maintain current weight</li>
        <li><strong>Focus on whole foods</strong>: vegetables, fruits, whole grains</li>
        <li><strong>Lean proteins</strong>: chicken, fish, tofu, legumes</li>
        <li><strong>Healthy fats</strong>: nuts, seeds, olive oil</li>
      </ul>
    `;
  } else if (bmi < 30) {
    dietPlan = `
      <h3>Diet Plan for Weight Loss</h3>
      <ul>
        <li><strong>Reduce calorie intake</strong> by 300-500 calories/day</li>
        <li><strong>High protein diet</strong> to preserve muscle</li>
        <li><strong>Limit processed foods</strong> and added sugars</li>
        <li><strong>More vegetables</strong> for fiber and nutrients</li>
        <li><strong>Healthy snacks</strong>: fruits, nuts, yogurt</li>
      </ul>
    `;
  } else {
    dietPlan = `
      <h3>Diet Plan for Obesity Management</h3>
      <ul>
        <li><strong>Medical supervision</strong> recommended</li>
        <li><strong>Structured meal plan</strong> with controlled portions</li>
        <li><strong>Focus on satiety</strong>: high fiber, high protein</li>
        <li><strong>Limit high-calorie foods</strong>: fried foods, sweets</li>
        <li><strong>Behavioral changes</strong>: mindful eating, food journaling</li>
      </ul>
    `;
  }
  
  document.getElementById("dietPlan").innerHTML = dietPlan;
}

function suggestWorkout(bmi) {
  let workoutPlan = "";
  
  if (bmi < 18.5) {
    workoutPlan = `
      <h3>Workout Plan for Muscle Building</h3>
      <div class="workout-list">
        <h4>Gym Workouts:</h4>
        <ul>
          <li><strong>Strength training</strong> 3-4 days/week (squats, deadlifts, bench press)</li>
          <li><strong>Compound exercises</strong> with progressive overload</li>
          <li><strong>Moderate cardio</strong> 2-3 days/week (20-30 mins)</li>
        </ul>
        <h4>Home Workouts:</h4>
        <ul>
          <li>Bodyweight exercises (push-ups, pull-ups, dips)</li>
          <li>Resistance band workouts</li>
          <li>Yoga for flexibility and core strength</li>
        </ul>
      </div>
    `;
  } else if (bmi < 25) {
    workoutPlan = `
      <h3>Workout Plan for Maintenance</h3>
      <div class="workout-list">
        <h4>Gym Workouts:</h4>
        <ul>
          <li><strong>Strength training</strong> 3 days/week (full body)</li>
          <li><strong>Cardio</strong> 2-3 days/week (30-45 mins)</li>
          <li><strong>Flexibility work</strong> (yoga or stretching)</li>
        </ul>
        <h4>Home Workouts:</h4>
        <ul>
          <li>Bodyweight circuit training</li>
          <li>HIIT workouts 2-3 days/week</li>
          <li>Pilates for core strength</li>
        </ul>
      </div>
    `;
  } else if (bmi < 30) {
    workoutPlan = `
      <h3>Workout Plan for Weight Loss</h3>
      <div class="workout-list">
        <h4>Gym Workouts:</h4>
        <ul>
          <li><strong>Cardio</strong> 4-5 days/week (45-60 mins)</li>
          <li><strong>Strength training</strong> 2-3 days/week</li>
          <li><strong>Interval training</strong> (HIIT) 1-2 days/week</li>
        </ul>
        <h4>Home Workouts:</h4>
        <ul>
          <li>Walking/jogging daily (10,000+ steps)</li>
          <li>Bodyweight exercises (squats, lunges, planks)</li>
          <li>Jump rope or stair climbing</li>
        </ul>
      </div>
    `;
  } else {
    workoutPlan = `
      <h3>Workout Plan for Obesity</h3>
      <div class="workout-list">
        <h4>Recommended Activities:</h4>
        <ul>
          <li><strong>Start slow</strong> with low-impact exercises</li>
          <li><strong>Walking</strong> (gradually increase duration)</li>
          <li><strong>Water aerobics</strong> or swimming</li>
          <li><strong>Chair exercises</strong> if mobility is limited</li>
          <li><strong>Consult doctor</strong> before starting any program</li>
        </ul>
      </div>
    `;
  }
  
  document.getElementById("workout").innerHTML = workoutPlan;
}

// ===== CALORIE CALCULATOR =====
document.getElementById('calculateCalories')?.addEventListener('click', calculateCalories);

function calculateCalories() {
  const age = parseFloat(document.getElementById('age').value);
  const gender = document.getElementById('gender').value;
  const activity = parseFloat(document.getElementById('activity').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);

  if (!age || !activity || !weight || !height) {
    return alert("Please fill all fields for calorie calculation!");
  }

  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const calories = Math.round(bmr * activity);
  const maintenance = Math.round(bmr * activity);
  const weightLoss = maintenance - 500;
  const weightGain = maintenance + 500;
  
  document.getElementById("calories").innerHTML = `
    <h3>Your Daily Calorie Needs</h3>
    <ul>
      <li><strong>Maintenance:</strong> ${maintenance} kcal/day</li>
      <li><strong>Weight Loss:</strong> ${weightLoss} kcal/day</li>
      <li><strong>Weight Gain:</strong> ${weightGain} kcal/day</li>
    </ul>
    <p>Note: Adjust based on your goals and consult a nutritionist for personalized advice.</p>
  `;
}

// ===== HISTORY FUNCTIONS =====
document.getElementById('clearHistory')?.addEventListener('click', clearHistory);

async function loadUserData(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();
    
    if (doc.exists) {
      const userData = doc.data();
      
      // Check if we have local history to migrate
      const localHistory = JSON.parse(localStorage.getItem("bmiHistory")) || [];
      if (localHistory.length > 0) {
        // Convert local history to Firestore format
        const historyEntries = localHistory.map(entry => ({
          bmi: entry.bmi,
          timestamp: new Date(entry.date)
        }));

        // Add to Firestore
        await db.collection('users').doc(userId).update({
          bmiHistory: firebase.firestore.FieldValue.arrayUnion(...historyEntries)
        });

        // Clear local storage
        localStorage.removeItem("bmiHistory");
        
        // Reload data after migration
        return loadUserData(userId);
      }

      // Update UI with history
      if (userData.bmiHistory) {
        updateHistoryUI(userData.bmiHistory);
      } else {
        document.getElementById('history').innerHTML = "<p>No history yet. Calculate your BMI to get started!</p>";
      }
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    renderHistory();
  }
}

function updateHistoryUI(history) {
  try {
    const historyList = document.getElementById('bmiHistoryList');
    const mainHistoryList = document.getElementById('history');
    
    if (!history || !Array.isArray(history)) {
      history = [];
    }
    
    // Sort history by timestamp (newest first)
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return dateB - dateA;
    });

    // Profile dropdown history (last 5 entries)
    if (historyList) {
      historyList.innerHTML = sortedHistory.slice(0, 5).map(entry => `
        <li>
          <span>${entry.bmi}</span>
          <span>${entry.timestamp?.toDate?.().toLocaleDateString() || new Date(entry.timestamp).toLocaleDateString()}</span>
        </li>
      `).join('');
    }
    
    // Main history section (all entries)
    if (mainHistoryList) {
      if (sortedHistory.length > 0) {
        mainHistoryList.innerHTML = "<ul>" + sortedHistory.map(entry => `
          <li>
            <span>${entry.timestamp?.toDate?.().toLocaleDateString() || new Date(entry.timestamp).toLocaleDateString()}</span>
            <span>BMI: ${entry.bmi}</span>
          </li>
        `).join('') + "</ul>";
      } else {
        mainHistoryList.innerHTML = "<p>No history yet. Calculate your BMI to get started!</p>";
      }
    }
  } catch (error) {
    console.error("Error updating history UI:", error);
  }
}

function renderHistory() {
  try {
    const user = firebase.auth().currentUser;
    const historyElement = document.getElementById('history');
    
    if (!user) {
      // For guests, show local storage history
      const history = JSON.parse(localStorage.getItem("bmiHistory")) || [];
      
      if (history.length > 0) {
        historyElement.innerHTML = "<ul>" + history.map(entry => `
          <li>
            <span>${new Date(entry.date).toLocaleDateString()}</span>
            <span>BMI: ${entry.bmi}</span>
          </li>
        `).join('') + "</ul>";
      } else {
        historyElement.innerHTML = "<p>No history yet. Calculate your BMI to get started!</p>";
      }
    }
  } catch (error) {
    console.error("Error rendering history:", error);
  }
}

async function clearHistory() {
  try {
    const user = firebase.auth().currentUser;
    
    if (user) {
      // Clear Firestore history
      await db.collection('users').doc(user.uid).update({
        bmiHistory: []
      });
    } else {
      // Clear local storage history
      localStorage.removeItem("bmiHistory");
    }
    
    // Update UI
    document.getElementById('bmiHistoryList').innerHTML = "";
    document.getElementById('history').innerHTML = "<p>No history yet. Calculate your BMI to get started!</p>";
  } catch (error) {
    console.error("Error clearing history:", error);
  }
}

async function storeBMI(userId, bmiValue) {
  try {
    const bmiEntry = {
      bmi: bmiValue,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Add the new BMI entry to Firestore
    await db.collection('users').doc(userId).update({
      bmiHistory: firebase.firestore.FieldValue.arrayUnion(bmiEntry)
    });

    console.log("BMI stored successfully");
    await loadUserData(userId); // Refresh the history display
  } catch (error) {
    console.error("Error storing BMI:", error);
    // Fallback to localStorage if Firestore fails
    const date = new Date().toISOString();
    let history = JSON.parse(localStorage.getItem("bmiHistory")) || [];
    history.push({ date, bmi: bmiValue });
    localStorage.setItem("bmiHistory", JSON.stringify(history));
    renderHistory();
  }
}

// ===== DOCTOR LIST =====
const doctors = [
  { 
    name: "Dr. Rajeev Sood", 
    specialty: "Endocrinologist", 
    contact: "011-12345678", 
    city: "Delhi",
    hospital: "Apollo Hospital"
  },
  { 
    name: "Dr. Aruna Mehta", 
    specialty: "Nutritionist", 
    contact: "022-87654321", 
    city: "Mumbai",
    hospital: "Kokilaben Hospital"
  },
  { 
    name: "Dr. Naveen Kumar", 
    specialty: "Bariatric Surgeon", 
    contact: "080-5551234", 
    city: "Bangalore",
    hospital: "Manipal Hospital"
  },
  { 
    name: "Dr. Priya Sharma", 
    specialty: "Dietician", 
    contact: "040-9876543", 
    city: "Hyderabad",
    hospital: "Yashoda Hospitals"
  },
  { 
    name: "Dr. Amit Patel", 
    specialty: "Sports Medicine", 
    contact: "079-2345678", 
    city: "Ahmedabad",
    hospital: "Civil Hospital"
  }
];

function renderDoctorList() {
  const doctorList = document.getElementById('doctorList');
  if (doctorList) {
    doctorList.innerHTML = doctors.map(doctor => `
      <div class="doctor-card">
        <h4>${doctor.name}</h4>
        <p><strong>Specialty:</strong> ${doctor.specialty}</p>
        <p><strong>Hospital:</strong> ${doctor.hospital}, ${doctor.city}</p>
        <p><strong>Contact:</strong> ${doctor.contact}</p>
      </div>
    `).join('');
  }
}

// ===== UTILITY FUNCTIONS =====
function clearForm() {
  document.getElementById('height').value = "";
  document.getElementById('weight').value = "";
  document.getElementById('age').value = "";
  document.getElementById('result').innerHTML = "";
  document.getElementById('bmiCategory').innerHTML = "";
  document.getElementById('healthAdvice').innerHTML = "";
  document.getElementById('dietPlan').innerHTML = "";
  document.getElementById('workout').innerHTML = "";
  document.getElementById('calories').innerHTML = "";
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  initializeDarkMode();
  renderDoctorList();
  
  // Initial render based on auth state
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      loadUserData(user.uid);
    } else {
      renderHistory();
    }
  });
  
  // Optional: Redirect if on localhost
  if (window.location.hostname === 'localhost') {
    window.location.href = "https://bmi-calculator-84c8b.web.app";
  }
});