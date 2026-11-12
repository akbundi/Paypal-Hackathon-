"""
Multilingual translations and localization engine for English, Hindi, and Marathi.
Provides verified domain-specific fraud terminology and explanatory templates.
"""

from typing import Dict, List, Any


# Standard localized risk level labels
RISK_LEVEL_LABELS = {
    "en": {
        "LOW": "Low Risk",
        "MEDIUM": "Medium Risk",
        "HIGH": "High Risk",
        "CRITICAL": "Critical Scam Risk"
    },
    "hi": {
        "LOW": "कम जोखिम (Low Risk)",
        "MEDIUM": "मध्यम जोखिम (Medium Risk)",
        "HIGH": "उच्च जोखिम (High Risk)",
        "CRITICAL": "अत्यधिक गंभीर घोटाला जोखिम (Critical Risk)"
    },
    "mr": {
        "LOW": "कमी धोका (Low Risk)",
        "MEDIUM": "मध्यम धोका (Medium Risk)",
        "HIGH": "उच्च धोका (High Risk)",
        "CRITICAL": "अत्यंत गंभीर फसवणूक धोका (Critical Risk)"
    }
}

# Localized category names
CATEGORY_NAMES = {
    "en": {
        "fake_urgency": "Fake Urgency / Pressure Tactics",
        "merchant_mismatch": "Merchant Identity Mismatch",
        "suspicious_amount": "Suspicious Billing Amount",
        "scam_language": "Known Scam Language Pattern",
        "suspicious_contact": "Deceptive Contact Number / Link"
    },
    "hi": {
        "fake_urgency": "नकली तात्कालिकता / दबाव बनाने की रणनीति",
        "merchant_mismatch": "व्यापारी की पहचान में बेमेल (Mismatch)",
        "suspicious_amount": "संदिग्ध भुगतान राशि",
        "scam_language": "ज्ञात घोटाले की भाषा शैली",
        "suspicious_contact": "संदिग्ध फ़ोन नंबर या लिंक"
    },
    "mr": {
        "fake_urgency": "खोटी तातडी / दबाव आणण्याचे तंत्र",
        "merchant_mismatch": "व्यापाऱ्याच्या ओळखीमधील तफावत (Mismatch)",
        "suspicious_amount": "संशयास्पद देय रक्कम",
        "scam_language": "ओळखलेली फसवणुकीची भाषा पद्धती",
        "suspicious_contact": "संशयास्पद फोन नंबर किंवा लिंक"
    }
}

# Localized standard recommendations
RECOMMENDATIONS_CATALOG = {
    "en": {
        "do_not_call": "Do not call the phone number provided in this invoice description or email.",
        "do_not_pay": "Do not authorize this payment or share your credit card / bank credentials.",
        "no_remote_access": "Never download remote desktop software (like AnyDesk, TeamViewer, or UltraViewer) requested by the sender.",
        "verify_official": "Check your official account activity directly by logging into the merchant's verified portal or app.",
        "report_phishing": "Forward this invoice to the fraud prevention department and mark it as phishing.",
        "safe_transaction": "This transaction appears legitimate. You may proceed normally, but always review receipt details."
    },
    "hi": {
        "do_not_call": "इस इनवॉइस विवरण या ईमेल में दिए गए किसी भी फोन नंबर पर कॉल न करें।",
        "do_not_pay": "इस भुगतान को अधिकृत (Authorize) न करें और न ही अपना बैंक विवरण या ओटीपी साझा करें।",
        "no_remote_access": "प्रेषक के कहने पर कभी भी रिमोट एक्सेस ऐप (जैसे AnyDesk, TeamViewer, या UltraViewer) डाउनलोड न करें।",
        "verify_official": "आधिकारिक वेबसाइट या ऐप में सीधे लॉग इन करके अपनी खाता गतिविधि की पुष्टि करें।",
        "report_phishing": "इस इनवॉइस को धोखाधड़ी रोकथाम विभाग को अग्रेषित (Forward) करें और इसे फ़िशिंग के रूप में चिह्नित करें।",
        "safe_transaction": "यह लेन-देन वैध प्रतीत होता है। आप सामान्य रूप से आगे बढ़ सकते हैं, लेकिन हमेशा रसीद विवरण की जांच करें।"
    },
    "mr": {
        "do_not_call": "या इनव्हॉइस तपशीलात किंवा ईमेलमध्ये दिलेल्या कोणत्याही फोन नंबरवर कॉल करू नका.",
        "do_not_pay": "या पेमेंटला मान्यता देऊ नका किंवा आपले बँक खाते तपशील अथवा पासवर्ड कोणाशीही शेअर करू नका.",
        "no_remote_access": "प्रेषकाच्या सांगण्यावरून कधीही AnyDesk, TeamViewer किंवा UltraViewer सारखे रिमोट ॲप्स डाउनलोड करू नका.",
        "verify_official": "अधिकृत ॲप किंवा वेबसाइटवर थेट लॉगिन करून आपल्या खात्यातील व्यवहार तपासा.",
        "report_phishing": "हे संशयास्पद इनव्हॉइस फसवणूक प्रतिबंध विभागाकडे पाठवा आणि स्पॅम/फिशिंग म्हणून नोंदवा.",
        "safe_transaction": "हा व्यवहार सुरक्षित दिसत आहे. आपण खात्री करून पुढील प्रक्रिया करू शकता."
    }
}


def build_localized_explanation(
    language: str,
    risk_level: str,
    risk_score: int,
    merchant_name: str,
    indicators: List[Dict[str, Any]],
    safeguard_category: str = None
) -> Dict[str, Any]:
    """
    Build a comprehensive, understandable explanation and actionable recommendations
    in the requested language (English, Hindi, or Marathi).
    """
    lang = language if language in ("en", "hi", "mr") else "en"
    
    if risk_score <= 30:
        if lang == "hi":
            explanation = (
                f"यह चालान (Invoice) '{merchant_name}' की ओर से कम जोखिम वाला प्रतीत होता है "
                f"(जोखिम स्कोर: {risk_score}/100)। कोई स्पष्ट धोखाधड़ी संकेत या दबाव की रणनीति नहीं पाई गई।"
            )
            recs = [
                RECOMMENDATIONS_CATALOG["hi"]["safe_transaction"],
                RECOMMENDATIONS_CATALOG["hi"]["verify_official"]
            ]
        elif lang == "mr":
            explanation = (
                f"हे इनव्हॉइस '{merchant_name}' कडून आलेले असून सुरक्षित दिसत आहे "
                f"(धोका गुण: {risk_score}/100). यामध्ये कोणताही फसवणुकीचा किंवा संशयास्पद दबाव आढळला नाही."
            )
            recs = [
                RECOMMENDATIONS_CATALOG["mr"]["safe_transaction"],
                RECOMMENDATIONS_CATALOG["mr"]["verify_official"]
            ]
        else:
            explanation = (
                f"This invoice from '{merchant_name}' appears to have a low risk of fraud "
                f"(Risk Score: {risk_score}/100). No blatant scam language or manipulative urgency was detected."
            )
            recs = [
                RECOMMENDATIONS_CATALOG["en"]["safe_transaction"],
                RECOMMENDATIONS_CATALOG["en"]["verify_official"]
            ]
        return {"explanation": explanation, "recommendations": recs}

    # Medium, High or Critical Risk
    reasons_en = []
    reasons_hi = []
    reasons_mr = []

    for ind in indicators:
        cat = ind.get("category")
        evidence = ind.get("evidence", "")
        
        if cat == "fake_urgency":
            reasons_en.append(f"artificial urgency detected ('{evidence}')")
            reasons_hi.append(f"कृत्रिम तात्कालिकता और जल्दबाजी का दबाव ('{evidence}')")
            reasons_mr.append(f"कृत्रिम तातडी आणि लवकर पैसे भरण्याचा दबाव ('{evidence}')")
        elif cat == "merchant_mismatch":
            reasons_en.append(f"sender email does not match claimed brand '{merchant_name}'")
            reasons_hi.append(f"ईमेल प्रेषक का पता अधिकृत '{merchant_name}' से मेल नहीं खाता")
            reasons_mr.append(f"ईमेल पाठवणाऱ्याचा पत्ता अधिकृत '{merchant_name}' शी जुळत नाही")
        elif cat == "suspicious_amount":
            reasons_en.append("atypical charge amount matching known scam billing patterns")
            reasons_hi.append("अस्वाभाविक बिलिंग राशि जो सामान्य घोटालों से मेल खाती है")
            reasons_mr.append("संशयास्पद बिलिंग रक्कम जी सामान्य फसवणुकीच्या प्रकारांशी जुळते")
        elif cat == "suspicious_contact":
            reasons_en.append(f"suspicious customer support contact number embedded in invoice text ('{evidence}')")
            reasons_hi.append(f"इनवॉइस विवरण में अनधिकृत हेल्पलाइन नंबर शामिल है ('{evidence}')")
            reasons_mr.append(f"इनव्हॉइस तपशीलात अनधिकृत मदत केंद्र नंबर नमूद केला आहे ('{evidence}')")
        elif cat == "scam_language":
            reasons_en.append("phrasing matching known refund and tech-support scams")
            reasons_hi.append("भाषा शैली जो रिफंड और तकनीकी सहायता घोटालों में इस्तेमाल होती है")
            reasons_mr.append("रिफंड आणि टेक सपोर्ट स्कॅममध्ये वापरली जाणारी संशयास्पद भाषा")

    if lang == "hi":
        reasons_str = "। इसके मुख्य कारण हैं: " + "। ".join(reasons_hi) if reasons_hi else ""
        explanation = (
            f"चेतावनी: इस चालान (Invoice) को उच्च जोखिम ({risk_score}/100) के रूप में चिह्नित किया गया है। "
            f"यह '{merchant_name}' के नाम पर किया गया संभावित घोटाला है{reasons_str}। "
            f"घोटालेबाज अक्सर आपको डराकर फर्जी नंबरों पर कॉल करने और पैसे चुकाने के लिए मजबूर करते हैं।"
        )
        recs = [
            RECOMMENDATIONS_CATALOG["hi"]["do_not_call"],
            RECOMMENDATIONS_CATALOG["hi"]["do_not_pay"],
            RECOMMENDATIONS_CATALOG["hi"]["no_remote_access"],
            RECOMMENDATIONS_CATALOG["hi"]["report_phishing"]
        ]
    elif lang == "mr":
        reasons_str = ". प्रमुख कारणे: " + ". ".join(reasons_mr) if reasons_mr else ""
        explanation = (
            f"इशारा: हे इनव्हॉइस अतिशय उच्च फसवणूक धोका ({risk_score}/100) दर्शवते. "
            f"हे '{merchant_name}' च्या नावाखाली केलेली संभाव्य फसवणूक असू शकते{reasons_str}. "
            f"फसवणूक करणारे सहसा तातडीचे कारण दाखवून बनावट नंबरवर कॉल करण्यास भाग पाडतात."
        )
        recs = [
            RECOMMENDATIONS_CATALOG["mr"]["do_not_call"],
            RECOMMENDATIONS_CATALOG["mr"]["do_not_pay"],
            RECOMMENDATIONS_CATALOG["mr"]["no_remote_access"],
            RECOMMENDATIONS_CATALOG["mr"]["report_phishing"]
        ]
    else:
        reasons_str = ". Key reasons: " + "; ".join(reasons_en) if reasons_en else ""
        explanation = (
            f"Warning: This invoice has been flagged with a high fraud risk score of {risk_score}/100. "
            f"It strongly indicates an impersonation scam targeting customers under the name '{merchant_name}'{reasons_str}. "
            f"Scammers routinely use fake invoices with urgent cancellation phone numbers to initiate tech support or refund traps."
        )
        recs = [
            RECOMMENDATIONS_CATALOG["en"]["do_not_call"],
            RECOMMENDATIONS_CATALOG["en"]["do_not_pay"],
            RECOMMENDATIONS_CATALOG["en"]["no_remote_access"],
            RECOMMENDATIONS_CATALOG["en"]["report_phishing"]
        ]

    return {"explanation": explanation, "recommendations": recs}

