const fs = require('fs');

const FILE_PATH = './frontend/src/i18n/translations.js';
let content = fs.readFileSync(FILE_PATH, 'utf8');

let ts;
eval(content.replace('export default translations;', 'ts = translations;'));

const newKeys = {
  en: {
    personalInfo: "Personal Information",
    updateNameDept: "Update your name and department",
    mobileNoChange: "Mobile number cannot be changed",
    saveChanges: "Save Changes",
    saving: "Saving...",
    changePassword: "Change Password",
    pwdSubtitle: "Use a strong password — minimum 8 characters",
    curPassword: "Current Password",
    newPassword: "New Password",
    confNewPassword: "Confirm New Password",
    changing: "Changing..."
  },
  hi: {
    personalInfo: "व्यक्तिगत जानकारी",
    updateNameDept: "अपना नाम और विभाग अपडेट करें",
    mobileNoChange: "मोबाइल नंबर नहीं बदला जा सकता",
    saveChanges: "परिवर्तन सहेजें",
    saving: "सहेज रहा है...",
    changePassword: "पासवर्ड बदलें",
    pwdSubtitle: "एक मजबूत पासवर्ड का उपयोग करें — न्यूनतम 8 वर्ण",
    curPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confNewPassword: "नए पासवर्ड की पुष्टि करें",
    changing: "बदल रहा है..."
  },
  mr: {
    personalInfo: "वैयक्तिक माहिती",
    updateNameDept: "तुमचे नाव आणि विभाग अपडेट करा",
    mobileNoChange: "मोबाईल नंबर बदलता येत नाही",
    saveChanges: "बदल जतन करा",
    saving: "जतन करत आहे...",
    changePassword: "पासवर्ड बदला",
    pwdSubtitle: "एक मजबूत पासवर्ड वापरा — किमान 8 अक्षरे",
    curPassword: "वर्तमान पासवर्ड",
    newPassword: "नवीन पासवर्ड",
    confNewPassword: "नवीन पासवर्डची पुष्टी करा",
    changing: "बदलत आहे..."
  },
  ta: {
    personalInfo: "தனிப்பட்ட தகவல்",
    updateNameDept: "உங்கள் பெயர் மற்றும் துறையைப் புதுப்பிக்கவும்",
    mobileNoChange: "கைபேசி எண்ணை மாற்ற முடியாது",
    saveChanges: "மாற்றங்களைச் சேமி",
    saving: "சேமிக்கிறது...",
    changePassword: "கடவுச்சொல்லை மாற்றவும்",
    pwdSubtitle: "வலுவான கடவுச்சொல்லைப் பயன்படுத்தவும் — குறைந்தது 8 எழுத்துக்கள்",
    curPassword: "தற்போதைய கடவுச்சொல்",
    newPassword: "புதிய கடவுச்சொல்",
    confNewPassword: "புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    changing: "மாற்றுகிறது..."
  },
  te: {
    personalInfo: "వ్యక్తిగత సమాచారం",
    updateNameDept: "మీ పేరు మరియు విభాగాన్ని నవీకరించండి",
    mobileNoChange: "మొబైల్ నంబర్ మార్చబడదు",
    saveChanges: "మార్పులను సేవ్ చేయండి",
    saving: "సేవ్ చేస్తోంది...",
    changePassword: "పాస్‌వర్డ్ మార్చండి",
    pwdSubtitle: "బలమైన పాస్‌వర్డ్‌ను ఉపయోగించండి — కనీసం 8 అక్షరాలు",
    curPassword: "ప్రస్తుత పాస్‌వర్డ్",
    newPassword: "కొత్త పాస్‌వర్డ్",
    confNewPassword: "కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి",
    changing: "మారుస్తోంది..."
  }
};

for (const lang of Object.keys(newKeys)) {
  ts[lang] = { ...ts[lang], ...newKeys[lang] };
}

const updatedContent = "const translations = " + JSON.stringify(ts, null, 2) + ";\n\nexport default translations;";
fs.writeFileSync(FILE_PATH, updatedContent);

console.log('Profile Translations added successfully');
