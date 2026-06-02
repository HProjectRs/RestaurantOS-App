export const ERROR_MESSAGES = {
  network: {
    ar: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت',
    fr: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
    en: 'Unable to connect to server. Check your internet connection.',
  },
  auth: {
    ar: 'انتهت الجلسة. سجل الدخول مرة أخرى',
    fr: 'Session expirée. Veuillez vous reconnecter.',
    en: 'Session expired. Please log in again.',
  },
  business: {
    insufficient_stock: {
      ar: 'المخزون غير كافٍ لإكمال الطلب',
      fr: 'Stock insuffisant pour terminer la commande.',
      en: 'Insufficient stock to complete the order.',
    },
    order_already_paid: {
      ar: 'الطلب مدفوع مسبقاً',
      fr: 'La commande est déjà payée.',
      en: 'Order is already paid.',
    },
    order_cancelled: {
      ar: 'تم إلغاء الطلب ولا يمكن تعديله',
      fr: 'La commande est annulée et ne peut être modifiée.',
      en: 'Order is cancelled and cannot be modified.',
    },
    duplicate_item: {
      ar: 'العنصر موجود مسبقاً',
      fr: 'Cet élément existe déjà.',
      en: 'Item already exists.',
    },
    employee_inactive: {
      ar: 'الموظف غير نشط حالياً',
      fr: "L'employé est actuellement inactif.",
      en: 'Employee is currently inactive.',
    },
  },
  validation: {
    required_field: {
      ar: 'هذا الحقل مطلوب',
      fr: 'Ce champ est requis.',
      en: 'This field is required.',
    },
    numbers_only: {
      ar: 'يُسمح بالأرقام فقط',
      fr: 'Chiffres uniquement.',
      en: 'Numbers only.',
    },
    invalid_email: {
      ar: 'البريد الإلكتروني غير صحيح',
      fr: 'Email invalide.',
      en: 'Invalid email address.',
    },
    min_length: {
      ar: 'يجب أن يكون النص على الأقل {min} أحرف',
      fr: 'Le texte doit contenir au moins {min} caractères.',
      en: 'Text must be at least {min} characters.',
    },
  },
  unknown: {
    ar: 'حدث خطأ غير متوقع. حاول مرة أخرى',
    fr: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    en: 'An unexpected error occurred. Please try again.',
  },
};
