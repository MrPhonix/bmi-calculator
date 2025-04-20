let userHistory = JSON.parse(localStorage.getItem('userHistory')) || [];

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  document.getElementById('aboutSection').classList.toggle('dark-mode');
}

function toggleLogin() {
  const userProfile = document.getElementById('userProfile');
  if (userProfile.style.display === 'none') {
    userProfile.style.display = 'block';
  } else {
    userProfile.style.display = 'none';
  }
}

function logout() {
  const userProfile = document.getElementById('userProfile');
  userProfile.style.display = 'none';
}

function calculateBMI() {
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const heightUnit = document.getElementById('heightUnit').value;
  const weightUnit = document.getElementById('weightUnit').value;

  const heightInMeters = convertHeightToMeters(height, heightUnit);
  const weightInKg = convertWeightToKg(weight, weightUnit);
  const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);

  let category = '', recommendation = '', diet = '', doctors = '';

  if (bmi < 18.6) {
    category = 'Underweight';
    recommendation = 'Consider a balanced diet rich in calories and consult a healthcare provider.';
    diet = 'Add high-protein, nutrient-dense foods like eggs, nuts, and dairy.';
  } else if (bmi >= 18.6 && bmi <= 24.9) {
    category = 'Normal';
    recommendation = 'Keep up the good work with a healthy diet and regular physical activity.';
    diet = 'Maintain a balanced diet with fruits, vegetables, lean protein, and whole grains.';
  } else {
    category = 'Overweight';
    recommendation = 'Incorporate regular exercise, reduce sugar intake, and consult a nutritionist.';
    diet = 'Focus on fiber-rich foods, avoid processed food, and control portion size.';
  }

  doctors = `
    <h4>Top Recommended Doctors in India</h4>
    <ul>
      <li><strong>Dr. Naresh Trehan</strong> - Medanta Hospital, Gurugram | +91-124-4141414</li>
      <li><strong>Dr. Devi Shetty</strong> - Narayana Health, Bengaluru | +91-80-7122-2222</li>
      <li><strong>Dr. Randeep Guleria</strong> - AIIMS, Delhi | +91-11-26588500</li>
    </ul>`;

  document.getElementById('results').innerHTML = `<h3>Your BMI is: ${bmi}</h3><h4>Status: ${category}</h4>`;
  document.getElementById('recommendation').innerHTML = `<p><strong>Recommendation:</strong> ${recommendation}</p>`;
  document.getElementById('dietPlan').innerHTML = `<p><strong>Suggested Diet Plan:</strong> ${diet}</p>`;
  document.getElementById('doctorList').innerHTML = doctors;

  userHistory.push({ bmi, category, date: new Date().toLocaleString() });
  localStorage.setItem('userHistory', JSON.stringify(userHistory));
  displayHistory();
  return false;
}

function calculateCalories() {
  const weight = parseFloat(document.getElementById('caloriesWeight').value);
  const activityLevel = document.getElementById('activityLevel').value;

  let calories = 0;
  if (activityLevel === 'sedentary') {
    calories = weight * 25;
  } else if (activityLevel === 'light') {
    calories = weight * 30;
  } else if (activityLevel === 'moderate') {
    calories = weight * 35;
  } else if (activityLevel === 'active') {
    calories = weight * 40;
  }

  document.getElementById('calorieResult').innerHTML = `Your daily calorie requirement: ${calories} kcal`;
}

function displayHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';

  userHistory.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `BMI: ${item.bmi}, Category: ${item.category}, Date: ${item.date}`;
    historyList.appendChild(li);
  });
}

function convertHeightToMeters(height, unit) {
  if (unit === 'cm') {
    return height / 100;
  } else if (unit === 'in') {
    return height * 0.0254;
  } else if (unit === 'ft') {
    return height * 0.3048;
  }
  return height;
}

function convertWeightToKg(weight, unit) {
  if (unit === 'lbs') {
    return weight * 0.453592;
  }
  return weight;
}

function clearForm() {
  document.getElementById("age").value = "";
  document.querySelector('input[name="gender"][value="male"]').checked = true;
  document.getElementById("height").value = "";
  document.getElementById("heightUnit").value = "cm";
  document.getElementById("weight").value = "";
  document.getElementById("weightUnit").value = "kg";
  document.getElementById("results").innerHTML = "";
  document.getElementById("recommendation").innerHTML = "";
  document.getElementById("dietPlan").innerHTML = "";
  document.getElementById("doctorList").innerHTML = "";
  document.getElementById("caloriesWeight").value = "";
  document.getElementById("activityLevel").value = "sedentary";
  document.getElementById("calorieResult").innerHTML = "";
  document.getElementById("workoutSuggestion").innerHTML = "";
}
