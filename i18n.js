const I18N_DICTIONARY = {
  en: {
    nav_dashboard: "Dashboard",
    nav_history: "History",
    nav_settings: "Settings",
    btn_connect_fb: "Connect Facebook",
    tag_official_meta: "Official Meta Graph API Integration",
    hero_title: "Count Facebook Comments Instantly",
    hero_subtitle: "Paste a Facebook post link and discover who commented the most with verified analytics.",
    btn_analyze: "Analyze Comments",
    label_demo_mode: "Demo Mode (Test without logging in)",
    status_not_connected: "Facebook Not Connected",
    status_connected: "Facebook Connected",
    prog_connecting: "Connecting to Meta Graph API...",
    tie_title: "Multiple users are tied for first place!",
    btn_tie_break: "Random Tie Breaker",
    winner_badge: "WINNER",
    btn_pick_another: "Pick Another Winner",
    btn_giveaway_settings: "Giveaway Options",
    stat_total_comments: "Total Comments",
    stat_unique_users: "Unique Commenters",
    stat_top_commenter: "Top Commenter",
    stat_avg_comments: "Average Comments/User",
    chart_title: "Top 10 Commenters Distribution",
    sort_most: "Most Comments",
    sort_least: "Least Comments",
    sort_name_asc: "Name (A-Z)",
    sort_name_desc: "Name (Z-A)",
    filter_all: "All",
    btn_print: "Print",
    th_rank: "Rank",
    th_name: "Commenter",
    th_comments: "Comments",
    th_percentage: "Percentage",
    th_last_active: "Last Activity",
    ph_search: "Search commenter...",
    modal_giveaway_title: "Giveaway Winner Selector",
    label_selection_method: "Selection Method",
    opt_most_comments: "Highest Number of Comments (#1)",
    opt_random: "Random Winner",
    label_weighted: "Weighted Chance (More comments = higher probability)",
    btn_roll_winner: "Draw Winner 🎉"
  },
  ckb: {
    nav_dashboard: "سەرەکی",
    nav_history: "مێژوو",
    nav_settings: "ڕێکخستنەکان",
    btn_connect_fb: "بەستنەوە بە فەیسبووک",
    tag_official_meta: "پەیوەستکراو بە Graph APIی فەرمیی مێتا",
    hero_title: "ژمارەکردنی کۆمێنتەکانی فەیسبووک بە خێرایی",
    hero_subtitle: "لینکی پۆستی فەیسبووک دابنێ و بزانە کێ زۆرترین کۆمێنتی کردووە لەگەڵ شیکاری ورد.",
    btn_analyze: "شیکارکردنی کۆمێنتەکان",
    label_demo_mode: "مۆدی تاقیکردنەوە (بێ چوونەژوورەوە)",
    status_not_connected: "فەیسبووک نەبەستراوەتەوە",
    status_connected: "فەیسبووک بەستراوەتەوە",
    prog_connecting: "پەیوەندیکردن بە Meta Graph API...",
    tie_title: "چەند بەکارهێنەرێک لە پلەی یەکەم یەکسانن!",
    btn_tie_break: "هەڵبژاردنی یەکێکیان بە بەخت",
    winner_badge: "براوە",
    btn_pick_another: "دیاریکردنی براوەیەکی تر",
    btn_giveaway_settings: "هەڵبژاردنەکانی تیروپشک",
    stat_total_comments: "کۆی کۆمێنتەکان",
    stat_unique_users: "کۆی بەشداربووان",
    stat_top_commenter: "پلەی یەکەم",
    stat_avg_comments: "تێکڕای کۆمێنت بۆ هەر کەسێک",
    chart_title: "دیاریکردنی ڕێژەی ١٠ یەکەمین بەشداربوو",
    sort_most: "زۆرترین کۆمێنت",
    sort_least: "کەمترین کۆمێنت",
    sort_name_asc: "ناو (ئەلفوبێ)",
    sort_name_desc: "ناو (پێچەوانە)",
    filter_all: "هەمووی",
    btn_print: "چاپکردن",
    th_rank: "ڕیزبەندی",
    th_name: "بەشداربوو",
    th_comments: "ژمارەی کۆمێنت",
    th_percentage: "ڕێژەی سەدی",
    th_last_active: "دوا چالاکی",
    ph_search: "گەڕان بەدوای ناو...",
    modal_giveaway_title: "دیاریکردنی براوەی تیروپشک",
    label_selection_method: "شێوازی هەڵبژاردن",
    opt_most_comments: "زۆرترین ژمارەی کۆمێنت (#1)",
    opt_random: "براوە بە هەڕەمەکی (بەخت)",
    label_weighted: "چاوپۆشی بەپێی چالاکی (کۆمێنتی زیاتر = هەلی زیاتر)",
    btn_roll_winner: "تیروپشک بکە 🎉"
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('commentrank_lang') || 'en';
    this.applyLanguage(this.currentLang);
  }

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('commentrank_lang', lang);
    this.applyLanguage(lang);
  }

  toggle() {
    const nextLang = this.currentLang === 'en' ? 'ckb' : 'en';
    this.setLanguage(nextLang);
  }

  applyLanguage(lang) {
    const isRtl = lang === 'ckb';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    const dict = I18N_DICTIONARY[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.placeholder = dict[key];
    });

    const langLabel = document.getElementById('langLabel');
    if (langLabel) {
      langLabel.textContent = lang === 'en' ? 'کوردی' : 'English';
    }
  }

  t(key) {
    return (I18N_DICTIONARY[this.currentLang] && I18N_DICTIONARY[this.currentLang][key]) || key;
  }
}

window.i18n = new I18nManager();
