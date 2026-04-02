"""
AI Healthcare Chatbot — Rule-based symptom checker and health advisor.
"""


SYMPTOM_DATABASE = {
    'fever': {
        'conditions': ['Flu', 'COVID-19', 'Malaria', 'Dengue', 'Typhoid'],
        'advice': 'Rest, stay hydrated, and monitor your temperature. Seek medical attention if fever exceeds 103°F (39.4°C) or persists for more than 3 days.',
        'urgency': 'moderate'
    },
    'headache': {
        'conditions': ['Migraine', 'Tension headache', 'Sinusitis', 'Hypertension'],
        'advice': 'Rest in a quiet, dark room. Stay hydrated and consider over-the-counter pain relief. Seek immediate care if headache is sudden and severe.',
        'urgency': 'low'
    },
    'chest pain': {
        'conditions': ['Heart Disease', 'Angina', 'GERD', 'Anxiety'],
        'advice': '⚠️ Chest pain can be serious. If accompanied by shortness of breath, sweating, or arm pain, seek emergency medical care immediately.',
        'urgency': 'high'
    },
    'cough': {
        'conditions': ['Common Cold', 'Bronchitis', 'Asthma', 'COVID-19', 'Pneumonia'],
        'advice': 'Stay hydrated, use honey for soothing. If cough persists beyond 2 weeks or produces blood, consult a doctor.',
        'urgency': 'low'
    },
    'fatigue': {
        'conditions': ['Anemia', 'Diabetes', 'Thyroid disorder', 'Depression', 'Sleep apnea'],
        'advice': 'Ensure adequate sleep (7-9 hours), balanced nutrition, and regular exercise. Persistent fatigue may indicate an underlying condition.',
        'urgency': 'low'
    },
    'shortness of breath': {
        'conditions': ['Asthma', 'Heart Disease', 'COPD', 'Pneumonia', 'Anxiety'],
        'advice': '⚠️ Difficulty breathing can be serious. If severe or sudden, seek emergency care. For mild cases, sit upright and breathe slowly.',
        'urgency': 'high'
    },
    'dizziness': {
        'conditions': ['Low blood pressure', 'Anemia', 'Inner ear disorder', 'Dehydration'],
        'advice': 'Sit or lie down immediately. Drink water. If recurring, get your blood pressure and blood sugar checked.',
        'urgency': 'moderate'
    },
    'nausea': {
        'conditions': ['Gastritis', 'Food poisoning', 'Pregnancy', 'Migraine'],
        'advice': 'Sip ginger tea or clear fluids. Avoid heavy meals. Seek care if accompanied by severe abdominal pain.',
        'urgency': 'low'
    },
    'frequent urination': {
        'conditions': ['Diabetes', 'UTI', 'Prostate issues', 'Kidney disease'],
        'advice': 'This could indicate diabetes or urinary tract issues. Get your blood sugar and urine tested.',
        'urgency': 'moderate'
    },
    'weight loss': {
        'conditions': ['Diabetes', 'Hyperthyroidism', 'Cancer', 'Depression'],
        'advice': 'Unexplained weight loss should be evaluated by a doctor. Get comprehensive blood tests done.',
        'urgency': 'moderate'
    },
    'joint pain': {
        'conditions': ['Arthritis', 'Gout', 'Lupus', 'Injury'],
        'advice': 'Apply ice, rest the affected joint. Anti-inflammatory foods may help. Consult a doctor if pain is persistent or severe.',
        'urgency': 'low'
    },
    'blurred vision': {
        'conditions': ['Diabetes', 'Hypertension', 'Glaucoma', 'Cataracts'],
        'advice': 'Get your eyes checked and monitor blood sugar and blood pressure levels. Sudden vision changes require immediate attention.',
        'urgency': 'moderate'
    }
}

FAQ_DATABASE = {
    'what is heart disease': 'Heart disease refers to conditions that involve narrowed or blocked blood vessels that can lead to heart attack, chest pain, or stroke. Key risk factors include high blood pressure, high cholesterol, smoking, diabetes, and family history.',
    'what is diabetes': 'Diabetes is a chronic condition where the body cannot properly process blood glucose (sugar). Type 1 is autoimmune, Type 2 is lifestyle-related. Symptoms include frequent urination, excessive thirst, and unexplained weight loss.',
    'what is kidney disease': 'Chronic kidney disease (CKD) is the gradual loss of kidney function. Common causes include diabetes and high blood pressure. Early stages may have no symptoms; later stages include swelling, fatigue, and changes in urination.',
    'how to prevent heart disease': 'Prevention includes: regular exercise (150+ min/week), healthy diet low in saturated fats, maintaining healthy weight, not smoking, managing stress, controlling blood pressure and cholesterol.',
    'how to prevent diabetes': 'Prevention includes: maintaining healthy weight, regular physical activity, balanced diet rich in fiber, limiting processed sugars, regular blood sugar monitoring, adequate sleep.',
    'what is bmi': 'BMI (Body Mass Index) = weight(kg) / height(m)². Categories: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (30+). BMI is a screening tool, not a diagnostic measure.',
    'what is blood pressure': 'Blood pressure measures the force of blood against artery walls. Normal: <120/80 mmHg. Elevated: 120-129/<80. High (Stage 1): 130-139/80-89. High (Stage 2): ≥140/≥90.',
    'what is cholesterol': 'Cholesterol is a waxy substance in your blood. Total cholesterol should be <200 mg/dL. LDL ("bad") should be <100 mg/dL. HDL ("good") should be >60 mg/dL.',
    'help': 'I can help you with:\n• Symptom checking — tell me your symptoms\n• Disease information — ask about any disease\n• Health advice — ask about prevention\n• Health metrics — BMI, blood pressure, cholesterol info\n\nTry: "I have chest pain and fatigue"'
}


def process_message(message):
    """Process user message and return chatbot response."""
    message_lower = message.lower().strip()

    # Check FAQ
    for question, answer in FAQ_DATABASE.items():
        if question in message_lower or message_lower in question:
            return {
                'response': answer,
                'type': 'info',
                'suggestions': ['What is heart disease?', 'How to prevent diabetes?', 'What is BMI?']
            }

    # Check for greetings
    greetings = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'greetings']
    if any(g in message_lower for g in greetings):
        return {
            'response': "Hello! 👋 I'm your AI Healthcare Assistant. I can help you understand symptoms, provide health information, and offer general medical guidance.\n\nTell me your symptoms or ask me a health question!",
            'type': 'greeting',
            'suggestions': ['I have a headache', 'What is diabetes?', 'How to prevent heart disease?', 'Help']
        }

    # Check for symptoms
    found_symptoms = []
    for symptom in SYMPTOM_DATABASE:
        if symptom in message_lower:
            found_symptoms.append(symptom)

    if found_symptoms:
        response_parts = []
        all_conditions = set()
        max_urgency = 'low'
        urgency_order = {'low': 0, 'moderate': 1, 'high': 2}

        for symptom in found_symptoms:
            info = SYMPTOM_DATABASE[symptom]
            all_conditions.update(info['conditions'])
            if urgency_order.get(info['urgency'], 0) > urgency_order.get(max_urgency, 0):
                max_urgency = info['urgency']

            response_parts.append(f"**{symptom.title()}**:\n{info['advice']}")

        conditions_list = ', '.join(sorted(all_conditions))
        urgency_msg = {
            'low': '🟢 Low urgency — Monitor your symptoms.',
            'moderate': '🟡 Moderate urgency — Consider consulting a doctor.',
            'high': '🔴 High urgency — Seek medical attention promptly!'
        }

        response = f"Based on your symptoms ({', '.join(found_symptoms)}), here's my analysis:\n\n"
        response += '\n\n'.join(response_parts)
        response += f"\n\n**Possible conditions**: {conditions_list}"
        response += f"\n\n**Urgency Level**: {urgency_msg[max_urgency]}"
        response += "\n\n⚕️ *Note: This is not a medical diagnosis. Please consult a healthcare professional for proper evaluation.*"

        return {
            'response': response,
            'type': 'symptom_analysis',
            'symptoms_found': found_symptoms,
            'possible_conditions': list(all_conditions),
            'urgency': max_urgency,
            'suggestions': ['Tell me more about ' + list(all_conditions)[0] if all_conditions else 'Help']
        }

    # Default response
    return {
        'response': "I'm not sure I understand. I can help with:\n\n• **Symptom analysis** — Describe your symptoms (e.g., 'I have fever and headache')\n• **Health information** — Ask about diseases (e.g., 'What is diabetes?')\n• **Prevention tips** — Ask how to prevent diseases\n• **Health metrics** — Learn about BMI, blood pressure, etc.\n\nType **'help'** for more options.",
        'type': 'fallback',
        'suggestions': ['I have fever', 'What is heart disease?', 'How to prevent diabetes?', 'Help']
    }
