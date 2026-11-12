import { Language } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  heroSub: string;
  nav: {
    overview: string;
    scamDetection: string;
    transactions: string;
    spendingGuard: string;
    trustedCircle: string;
    settings: string;
    sandboxActive: string;
  };
  overview: {
    title: string;
    subtitle: string;
    totalProtected: string;
    scamsDetected: string;
    moneySaved: string;
    agentSpending: string;
    weeklyBudget: string;
    securityFeed: string;
    fraudTrends: string;
    spendingBreakdown: string;
    recentTransactions: string;
    viewAll: string;
    quickScan: string;
    quickScanDesc: string;
  };
  scamDetection: {
    title: string;
    subtitle: string;
    invoiceDesc: string;
    senderName: string;
    senderEmail: string;
    amount: string;
    messageText: string;
    analyzeBtn: string;
    analyzing: string;
    quickPresets: string;
    riskScore: string;
    fraudSignals: string;
    explanation: string;
    recommendedAction: string;
    holdPayment: string;
    approvePayment: string;
    blockPayment: string;
    notifyContact: string;
  };
  spendingGuard: {
    title: string;
    subtitle: string;
    weeklyLimit: string;
    amountSpent: string;
    remainingBudget: string;
    agentToggle: string;
    agentToggleDesc: string;
    rulesList: string;
    addRule: string;
    simulatorTitle: string;
    simulateBtn: string;
    recentAgentPurchases: string;
  };
  trustedCircle: {
    title: string;
    subtitle: string;
    addContact: string;
    pendingApprovals: string;
    activeContacts: string;
    approve: string;
    reject: string;
  };
  transactions: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterStatus: string;
    filterRisk: string;
    exportCsv: string;
    tableId: string;
    tableSender: string;
    tableAmount: string;
    tableDate: string;
    tableRisk: string;
    tableStatus: string;
    tableAction: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageDesc: string;
    security: string;
    sandbox: string;
    notifications: string;
    saveChanges: string;
  };
  common: {
    low: string;
    medium: string;
    high: string;
    critical: string;
    protected: string;
    blocked: string;
    held: string;
    search: string;
    cancel: string;
    save: string;
    confirm: string;
    close: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'PayGuard',
    tagline: 'Your money. Your rules. Your protection.',
    heroSub: 'AI detects the scam. PayGuard explains the risk. You stay in control.',
    nav: {
      overview: 'Overview',
      scamDetection: 'Scam Detection',
      transactions: 'Transactions',
      spendingGuard: 'Spending Guard',
      trustedCircle: 'Trusted Circle',
      settings: 'Settings',
      sandboxActive: 'PayPal Sandbox Active',
    },
    overview: {
      title: 'Payment Security Overview',
      subtitle: 'Real-time payment interception and autonomous agent policy enforcement.',
      totalProtected: 'Total Payments Protected',
      scamsDetected: 'Scams Intercepted',
      moneySaved: 'Total Money Saved',
      agentSpending: 'AI Agent Spending This Week',
      weeklyBudget: 'of weekly budget',
      securityFeed: 'Live Security Activity Feed',
      fraudTrends: 'Fraud Threat Distribution',
      spendingBreakdown: 'Weekly Spending Trends',
      recentTransactions: 'Recent Intercepted & Cleared Transactions',
      viewAll: 'View All',
      quickScan: 'Quick Invoice Scanner',
      quickScanDesc: 'Paste an invoice or payment request to test AI scam detection instantly.',
    },
    scamDetection: {
      title: 'AI Fraud & Invoice Risk Detection',
      subtitle: 'Inspect invoices, check sender domain integrity, and evaluate coercion cues before authorizing payment.',
      invoiceDesc: 'Invoice / Product Description',
      senderName: 'Sender / Business Name',
      senderEmail: 'Sender Email or PayPal ID',
      amount: 'Requested Payment Amount ($)',
      messageText: 'Payment Request Note / Urgency Message',
      analyzeBtn: 'Run Fraud Risk Evaluation',
      analyzing: 'Evaluating fraud signals & domain...',
      quickPresets: 'Or test a sample scenario:',
      riskScore: 'Risk Assessment Score',
      fraudSignals: 'Detected Fraud Signals',
      explanation: 'Risk Evaluation Breakdown',
      recommendedAction: 'Recommended Safety Action',
      holdPayment: 'Hold in Escrow (24h)',
      approvePayment: 'Approve Payment',
      blockPayment: 'Block & Blacklist Sender',
      notifyContact: 'Notify Trusted Contact',
    },
    spendingGuard: {
      title: 'AI Spending Guard',
      subtitle: 'Establish hard boundary guardrails and verification policies for autonomous shopping agents.',
      weeklyLimit: 'Weekly Spending Limit',
      amountSpent: 'Amount Spent',
      remainingBudget: 'Remaining Budget',
      agentToggle: 'Autonomous Agent Purchases',
      agentToggleDesc: 'When disabled, all AI agent transactions are immediately blocked regardless of rules.',
      rulesList: 'Active Spending Rules & Guardrails',
      addRule: 'Create Spending Rule',
      simulatorTitle: 'Purchase Verification Simulator',
      simulateBtn: 'Simulate Agent Transaction',
      recentAgentPurchases: 'AI Agent Purchase Log',
    },
    trustedCircle: {
      title: 'Trusted Circle & Family Guard',
      subtitle: 'Multi-party approval system for high-risk purchases and vulnerable account protection.',
      addContact: 'Add Trusted Contact',
      pendingApprovals: 'Pending Payment Approvals',
      activeContacts: 'Configured Trusted Approvers',
      approve: 'Authorize Payment',
      reject: 'Decline & Block',
    },
    transactions: {
      title: 'Transaction Audit Trail',
      subtitle: 'Immutable record of PayPal Sandbox transactions, fraud intercepts, and spending audits.',
      searchPlaceholder: 'Search by ID, sender, email, or invoice description...',
      filterStatus: 'Status Filter',
      filterRisk: 'Risk Level',
      exportCsv: 'Export Log',
      tableId: 'Transaction ID',
      tableSender: 'Sender / Merchant',
      tableAmount: 'Amount',
      tableDate: 'Timestamp',
      tableRisk: 'AI Risk',
      tableStatus: 'Enforcement Status',
      tableAction: 'Action',
    },
    settings: {
      title: 'System Settings & Integrations',
      subtitle: 'Configure PayPal Sandbox credentials, LLM fraud models, and localized policies.',
      language: 'Interface Language',
      languageDesc: 'Choose your preferred dashboard language for alerts and explanations.',
      security: 'Security & Auto-Quarantine Rules',
      sandbox: 'PayPal Sandbox & Webhook Configuration',
      notifications: 'Alert Channels & Escrow Timers',
      saveChanges: 'Save Configuration',
    },
    common: {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
      critical: 'Critical Risk',
      protected: 'Protected',
      blocked: 'Blocked',
      held: 'Held for Approval',
      search: 'Search',
      cancel: 'Cancel',
      save: 'Save Changes',
      confirm: 'Confirm',
      close: 'Close',
    },
  },

  hi: {
    appName: 'PayGuard',
    tagline: 'आपका पैसा। आपके नियम। आपकी सुरक्षा।',
    heroSub: 'AI घोटाले की पहचान करता है। PayGuard जोखिम समझाता है। नियंत्रण आपके हाथ में है।',
    nav: {
      overview: 'अवलोकन (Overview)',
      scamDetection: 'घोटाला पहचान (Scam Detection)',
      transactions: 'लेनदेन (Transactions)',
      spendingGuard: 'खर्च नियंत्रण (Spending Guard)',
      trustedCircle: 'विश्वसनीय संपर्क (Trusted Circle)',
      settings: 'सेटिंग्स (Settings)',
      sandboxActive: 'पेपैल सैंडबॉक्स सक्रिय',
    },
    overview: {
      title: 'भुगतान सुरक्षा अवलोकन (Payment Security Overview)',
      subtitle: 'वास्तविक समय में संदिग्ध भुगतान की रोकथाम और AI एजेंट नियंत्रण।',
      totalProtected: 'कुल संरक्षित भुगतान',
      scamsDetected: 'पकड़े गए घोटाले',
      moneySaved: 'बचाई गई कुल राशि',
      agentSpending: 'इस सप्ताह AI एजेंट का खर्च',
      weeklyBudget: 'साप्ताहिक बजट में से',
      securityFeed: 'लाइव सुरक्षा गतिविधि फ़ीड',
      fraudTrends: 'धोखाधड़ी जोखिम वितरण',
      spendingBreakdown: 'साप्ताहिक व्यय रुझान',
      recentTransactions: 'हाल ही में रोके और मंज़ूर किए गए लेनदेन',
      viewAll: 'सभी देखें',
      quickScan: 'त्वरित इनवॉइस स्कैनर',
      quickScanDesc: 'AI से त्वरित जांच के लिए इनवॉइस विवरण यहां पेस्ट करें।',
    },
    scamDetection: {
      title: 'AI घोटाला और धोखाधड़ी विश्लेषक',
      subtitle: 'इनवॉइस, प्रेषक और संदेश का AI तकनीक द्वारा गहन विश्लेषण करें।',
      invoiceDesc: 'इनवॉइस / उत्पाद विवरण',
      senderName: 'प्रेषक / कंपनी का नाम',
      senderEmail: 'प्रेषक का ईमेल या पेपैल आईडी',
      amount: 'मांगी गई भुगतान राशि ($)',
      messageText: 'संदेश या तात्कालिकता का कारण',
      analyzeBtn: 'AI से विश्लेषण करें',
      analyzing: 'धोखाधड़ी के संकेतों का विश्लेषण हो रहा है...',
      quickPresets: 'या कोई नमूना परिदृश्य चुनें:',
      riskScore: 'जोखिम मूल्यांकन स्कोर',
      fraudSignals: 'पाए गए धोखाधड़ी संकेत',
      explanation: 'सरल भाषा में AI व्याख्या',
      recommendedAction: 'अनुशंसित सुरक्षा कार्रवाई',
      holdPayment: '24 घंटे रोकें (Hold)',
      approvePayment: 'भुगतान स्वीकृत करें',
      blockPayment: 'ब्लॉक करें और रिपोर्ट करें',
      notifyContact: 'विश्वसनीय व्यक्ति को सूचित करें',
    },
    spendingGuard: {
      title: 'AI खर्च सुरक्षा (Spending Guard)',
      subtitle: 'AI शॉपिंग एजेंटों के लिए सुरक्षित सीमाएं और नियम तय करें।',
      weeklyLimit: 'साप्ताहिक खर्च सीमा',
      amountSpent: 'खर्च की गई राशि',
      remainingBudget: 'शेष बजट',
      agentToggle: 'AI एजेंट द्वारा खरीदारी की अनुमति',
      agentToggleDesc: 'बंद करने पर सभी AI एजेंट लेनदेन तुरंत रोक दिए जाएंगे।',
      rulesList: 'सक्रिय खर्च नियम',
      addRule: 'नया नियम बनाएं',
      simulatorTitle: 'खरीदारी सत्यापन सिम्युलेटर',
      simulateBtn: 'एजेंट खरीदारी का परीक्षण करें',
      recentAgentPurchases: 'AI एजेंट खरीदारी इतिहास',
    },
    trustedCircle: {
      title: 'विश्वसनीय परिवार व मित्र घेरा',
      subtitle: 'बड़े या संदिग्ध भुगतानों के लिए पारिवारिक स्वीकृति प्रणाली।',
      addContact: 'विश्वसनीय संपर्क जोड़ें',
      pendingApprovals: 'स्वीकृति की प्रतीक्षा में भुगतान',
      activeContacts: 'कॉन्फ़िगर किए गए संपर्क',
      approve: 'भुगतान की अनुमति दें',
      reject: 'अस्वीकार और ब्लॉक करें',
    },
    transactions: {
      title: 'लेनदेन इतिहास व ऑडिट लॉग',
      subtitle: 'सैंडबॉक्स भुगतान, रोके गए घोटाले और सुरक्षा ऑडिट का पूरा रिकॉर्ड।',
      searchPlaceholder: 'आईडी, प्रेषक या विवरण से खोजें...',
      filterStatus: 'स्थिति फ़िल्टर',
      filterRisk: 'जोखिम स्तर',
      exportCsv: 'लॉग डाउनलोड करें',
      tableId: 'लेनदेन आईडी',
      tableSender: 'प्रेषक / व्यापारी',
      tableAmount: 'राशि',
      tableDate: 'समय',
      tableRisk: 'AI जोखिम',
      tableStatus: 'स्थिति',
      tableAction: 'कार्रवाई',
    },
    settings: {
      title: 'सिस्टम सेटिंग्स और एकीकरण',
      subtitle: 'PayPal सैंडबॉक्स क्रेडेंशियल्स और सुरक्षा प्राथमिकताओं को प्रबंधित करें।',
      language: 'इंटरफ़ेस भाषा',
      languageDesc: 'डैशबोर्ड और अलर्ट के लिए अपनी पसंदीदा भाषा चुनें।',
      security: 'सुरक्षा और स्वचालित नियम',
      sandbox: 'पेपैल सैंडबॉक्स और वेबहुक',
      notifications: 'सूचना चैनल',
      saveChanges: 'सेटिंग्स सहेजें',
    },
    common: {
      low: 'कम जोखिम',
      medium: 'मध्यम जोखिम',
      high: 'उच्च जोखिम',
      critical: 'गंभीर जोखिम',
      protected: 'सुरक्षित',
      blocked: 'अवरुद्ध (Blocked)',
      held: 'स्वीकृति लंबित',
      search: 'खोजें',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      confirm: 'पुष्टि करें',
      close: 'बंद करें',
    },
  },

  mr: {
    appName: 'PayGuard',
    tagline: 'तुमचे पैसे. तुमचे नियम. तुमचे संरक्षण.',
    heroSub: 'AI फसवणूक ओळखतो. PayGuard धोका समजावून सांगतो. नियंत्रण तुमच्या हातात राहते.',
    nav: {
      overview: 'आढावा (Overview)',
      scamDetection: 'घोटाळा तपासणी (Scam Detection)',
      transactions: 'व्यवहार (Transactions)',
      spendingGuard: 'खर्च नियंत्रण (Spending Guard)',
      trustedCircle: 'विश्वासू वर्तुळ (Trusted Circle)',
      settings: 'सेटिंग्ज (Settings)',
      sandboxActive: 'PayPal सँडबॉक्स सक्रिय',
    },
    overview: {
      title: 'पेमेंट सुरक्षा आढावा (Payment Security Overview)',
      subtitle: 'संशयास्पद व्यवहारांची त्वरित तपासणी आणि स्वायत्त AI एजंट नियंत्रण.',
      totalProtected: 'एकूण सुरक्षित व्यवहार',
      scamsDetected: 'उघडकीस आलेले घोटाळे',
      moneySaved: 'वाचवलेली एकूण रक्कम',
      agentSpending: 'या आठवड्यातील AI खर्च',
      weeklyBudget: 'साप्ताहिक बजेटपैकी',
      securityFeed: 'थेट सुरक्षा क्रियाकलाप',
      fraudTrends: 'धोकादायक व्यवहारांचे प्रमाण',
      spendingBreakdown: 'साप्ताहिक खर्च प्रवाह',
      recentTransactions: 'अलीकडील तपासलेले व्यवहार',
      viewAll: 'सर्व पहा',
      quickScan: 'द्रुत इनव्हॉइस स्कॅनर',
      quickScanDesc: 'AI द्वारे स्कॅम तपासण्यासाठी इनव्हॉइस तपशील येथे टाका.',
    },
    scamDetection: {
      title: 'AI स्कॅम आणि फसवणूक विश्लेषक',
      subtitle: 'इनव्हॉइस, पाठवणारा आणि संदेशाची AI द्वारे सखोल पडताळणी.',
      invoiceDesc: 'इनव्हॉइस / वस्तू वर्णन',
      senderName: 'पाठवणाऱ्याचे / कंपनीचे नाव',
      senderEmail: 'ईमेल किंवा PayPal आयडी',
      amount: 'मागितलेली रक्कम ($)',
      messageText: 'संदेश किंवा तातडीचे कारण',
      analyzeBtn: 'AI द्वारे विश्लेषण करा',
      analyzing: 'फसवणुकीच्या संकेतांची तपासणी सुरू आहे...',
      quickPresets: 'किंवा नमुना परिस्थिती निवडा:',
      riskScore: 'धोका मूल्यांकन गुण',
      fraudSignals: 'आढळलेले फसवणुकीचे संकेत',
      explanation: 'सोप्या भाषेतील AI स्पष्टीकरण',
      recommendedAction: 'शिफारस केलेली सुरक्षा कृती',
      holdPayment: '२४ तास रोखून ठेवा (Hold)',
      approvePayment: 'व्यवहार मंजूर करा',
      blockPayment: 'ब्लॉक आणि तक्रार करा',
      notifyContact: 'विश्वासू संपर्कास कळवा',
    },
    spendingGuard: {
      title: 'AI खर्च सुरक्षा (Spending Guard)',
      subtitle: 'AI खरेदी एजंट्ससाठी सुरक्षित मर्यादा आणि नियम निश्चित करा.',
      weeklyLimit: 'साप्ताहिक खर्च मर्यादा',
      amountSpent: 'झालेला खर्च',
      remainingBudget: 'उर्वरित बजेट',
      agentToggle: 'AI एजंट खरेदी परवानगी',
      agentToggleDesc: 'बंद केल्यास सर्व AI एजंट व्यवहार त्वरित रोखले जातील.',
      rulesList: 'सक्रिय खर्च नियम',
      addRule: 'नवीन नियम तयार करा',
      simulatorTitle: 'खरेदी पडताळणी सिम्युलेटर',
      simulateBtn: 'एजंट व्यवहाराची चाचणी घ्या',
      recentAgentPurchases: 'AI एजंट खरेदी इतिहास',
    },
    trustedCircle: {
      title: 'विश्वासू कुटुंब व मित्र वर्तुळ',
      subtitle: 'मोठ्या किंवा संशयास्पद व्यवहारांसाठी कौटुंबिक संमती प्रणाली.',
      addContact: 'विश्वासू व्यक्ती जोडा',
      pendingApprovals: 'मंजुरीच्या प्रतीक्षेतील व्यवहार',
      activeContacts: 'सक्रिय अनुमोदक',
      approve: 'व्यवहारास मंजुरी द्या',
      reject: 'नाकारा आणि ब्लॉक करा',
    },
    transactions: {
      title: 'व्यवहार इतिहास आणि ऑडिट नोंद',
      subtitle: 'PayPal सँडबॉक्स व्यवहार, रोखलेले घोटाळे आणि सुरक्षा नोंदी.',
      searchPlaceholder: 'आयडी, पाठवणारा किंवा वर्णनाने शोधा...',
      filterStatus: 'स्थिती फिल्टर',
      filterRisk: 'धोका पातळी',
      exportCsv: 'नोंद डाऊनलोड करा',
      tableId: 'व्यवहार आयडी',
      tableSender: 'पाठवणारा / विक्रेता',
      tableAmount: 'रक्कम',
      tableDate: 'वेळ',
      tableRisk: 'AI धोका',
      tableStatus: 'स्थिती',
      tableAction: 'कृती',
    },
    settings: {
      title: 'प्रणाली सेटिंग्ज आणि जोडण्या',
      subtitle: 'PayPal सँडबॉक्स तपशील आणि सुरक्षा प्राधान्ये व्यवस्थापित करा.',
      language: 'भाषा निवडा',
      languageDesc: 'डॅशबोर्ड आणि अलर्टसाठी तुमची पसंतीची भाषा निवडा.',
      security: 'सुरक्षा आणि ऑटो-ब्लॉक नियम',
      sandbox: 'PayPal सँडबॉक्स आणि वेबहुक',
      notifications: 'सूचना चॅनेल्स',
      saveChanges: 'बदल जतन करा',
    },
    common: {
      low: 'कमी धोका',
      medium: 'मध्यम धोका',
      high: 'जास्त धोका',
      critical: 'अत्यंत गंभीर धोका',
      protected: 'सुरक्षित',
      blocked: 'अवरोधित (Blocked)',
      held: 'मंजुरी प्रलंबित',
      search: 'शोधा',
      cancel: 'रद्द करा',
      save: 'जतन करा',
      confirm: 'खात्री करा',
      close: 'बंद करा',
    },
  },
};
