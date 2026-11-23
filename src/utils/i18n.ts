export type Language = 'en' | 'ta';

export interface Translations {
  header: {
    title: string;
    subtitle: string;
    muteSound: string;
    unmuteSound: string;
    exit: string;
  };
  languageModal: {
    title: string;
    subtitle: string;
    english: string;
    tamil: string;
  };
  desktopModal: {
    title: string;
    message: string;
    button: string;
  };
  confirmExitModal: {
    title: string;
    message: string;
    confirm: string;
    stay: string;
  };
  landing: {
    tagline: string;
    heading: string;
    subheading: string;
    startBtn: string;
    privacyNote: string;
    disclaimer: string;
  };
  inputChoice: {
    tagline: string;
    heading: string;
    subheading: string;
    speakTitle: string;
    speakDesc: string;
    writeTitle: string;
    writeDesc: string;
  };
  typing: {
    tagline: string;
    heading: string;
    subheading: string;
    inputLabel: string;
    placeholder: string;
    footNote: string;
    continueBtn: string;
    clearBtn: string;
    backBtn: string;
  };
  recording: {
    ready: string;
    waitingMic: string;
    recording: string;
    paused: string;
    saving: string;
    headingActive: string;
    headingIdle: string;
    privacyNote: string;
    durationLeft: (left: string, total: number) => string;
    durationLimit: (total: number) => string;
    micLive: string;
    resume: string;
    pause: string;
    stop: string;
    discard: string;
  };
  review: {
    tagline: string;
    heading: string;
    subheading: string;
    playLabel: string;
    pauseLabel: string;
    hitLimit: (minutes: number) => string;
    playbackUnavailable: string;
    playbackError: string;
    continueBtn: string;
    recordAgain: string;
    deleteBtn: string;
    deleteNotice: string;
  };
  choose: {
    tagline: string;
    heading: string;
    subheadingVoice: string;
    subheadingText: string;
    burnTitle: string;
    burnDesc: string;
    shredTitle: string;
    shredDesc: string;
    reduceMotion: string;
    backToReview: string;
    backToTyping: string;
  };
  destruction: {
    burnCaption: string;
    shredCaption: string;
    skip: string;
  };
  completion: {
    heading: string;
    subheading: string;
    shareBtn: string;
    finish: string;
    keptNotice: string;
    takeTime: string;
    shareCopied: string;
    shareTitle: string;
    shareText: string;
  };
  permission: {
    goBack: string;
    tryAgain: string;
    disclaimer: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    header: {
      title: 'guessme.co',
      subtitle: 'Let It Go',
      muteSound: 'Mute sound effects',
      unmuteSound: 'Unmute sound effects',
      exit: 'Exit',
    },
    languageModal: {
      title: 'Choose Language / மொழியைத் தேர்ந்தெடுக்கவும்',
      subtitle: 'Please select your preferred language:',
      english: 'English',
      tamil: 'தமிழ்',
    },
    desktopModal: {
      title: 'Use Desktop for Better Experience',
      message: 'For the best visual and audio experience, using a desktop or larger screen is recommended.',
      button: 'Got It',
    },
    confirmExitModal: {
      title: 'Leave this session?',
      message: 'Your recording or message will be discarded right away. Nothing from this session is kept after you leave.',
      confirm: 'Leave and discard',
      stay: 'Stay',
    },
    landing: {
      tagline: 'Speak it. Release it. Let it go.',
      heading: 'Whatever is on your mind,\nlet it out.',
      subheading: "A private space to express what you're carrying and let it go.",
      startBtn: 'Start Letting Go',
      privacyNote: "Your words and recordings stay in this tab and aren't uploaded. If analytics is enabled, anonymous usage events (such as choices and screen changes) may be sent to help improve the app.",
      disclaimer: 'This is a personal ritual, not a substitute for professional mental-health support. If you are in crisis, please reach out to someone you trust or local emergency services.',
    },
    inputChoice: {
      tagline: 'Your private ritual',
      heading: 'How do you want to let it go?',
      subheading: 'Speak it or write it. Either way, it stays in this tab and is discarded after the ritual.',
      speakTitle: 'Speak it',
      speakDesc: 'Record your voice. Nothing is uploaded or transcribed.',
      writeTitle: 'Write it',
      writeDesc: 'Type your thoughts. Nothing is saved or sent anywhere.',
    },
    typing: {
      tagline: 'Write it down',
      heading: 'Put it into words.',
      subheading: "Type what you're carrying. It stays in this browser tab, is never uploaded, and is discarded when the ritual ends.",
      inputLabel: 'Your message',
      placeholder: 'Start writing…',
      footNote: 'Your words will appear on the paper — and then be gone.',
      continueBtn: 'Continue',
      clearBtn: 'Clear',
      backBtn: 'Back',
    },
    recording: {
      ready: 'Ready when you are',
      waitingMic: 'Waiting for microphone permission…',
      recording: 'Recording',
      paused: 'Paused',
      saving: 'Saving in memory…',
      headingActive: 'Say what is on your mind.',
      headingIdle: 'Speak freely.',
      privacyNote: 'Nobody else hears this. Audio stays in this browser tab, is never uploaded, and is discarded when you finish.',
      durationLeft: (left, total) => `${left} left of ${total} min`,
      durationLimit: (total) => `Limit ${total} minutes`,
      micLive: 'Mic live',
      resume: 'Resume',
      pause: 'Pause',
      stop: 'Stop',
      discard: 'Discard without saving',
    },
    review: {
      tagline: 'Private review',
      heading: 'Listen back, if you wish.',
      subheading: 'Nothing is transcribed or analysed. When you are ready, continue to let it go.',
      playLabel: 'Play recording',
      pauseLabel: 'Pause playback',
      hitLimit: (minutes) => `This recording reached the ${minutes}-minute limit.`,
      playbackUnavailable: 'Playback is unavailable for this recording. You can still continue or delete it.',
      playbackError: 'Playback could not start. Check your speaker or try again.',
      continueBtn: 'Continue',
      recordAgain: 'Record again',
      deleteBtn: 'Delete',
      deleteNotice: 'Recording deleted. Nothing was kept.',
    },
    choose: {
      tagline: 'Choose how to release it',
      heading: 'Let it go.',
      subheadingVoice: 'Your recording will be discarded when this ends. Choose one.',
      subheadingText: 'Your words will be discarded when this ends. Choose one.',
      burnTitle: 'Burn',
      burnDesc: 'Watch the paper curl, char and turn to ash.',
      shredTitle: 'Shred',
      shredDesc: 'Feed the paper into the shredder and watch it fall away in strips.',
      reduceMotion: 'Reduce motion',
      backToReview: 'Back to recording review',
      backToTyping: 'Back to editing',
    },
    destruction: {
      burnCaption: 'Let it burn.',
      shredCaption: 'Feeding it through.',
      skip: 'Skip animation',
    },
    completion: {
      heading: "It's okay to let go.",
      subheading: 'Take a breath. Give yourself a moment.',
      shareBtn: 'Share',
      finish: 'Finish',
      keptNotice: 'Nothing you said has been kept.',
      takeTime: 'Take your time…',
      shareCopied: 'Link Copied!',
      shareTitle: 'Let It Go — Speak it. Release it.',
      shareText: 'Take a moment for yourself. Express freely and move forward.',
    },
    permission: {
      goBack: 'Go back',
      tryAgain: 'Try again',
      disclaimer: 'Nothing is recorded or stored until you allow the microphone and press record.',
    },
  },
  ta: {
    header: {
      title: 'guessme.co',
      subtitle: 'விட்டுவிடுங்கள்',
      muteSound: 'ஒலியை முடக்கு',
      unmuteSound: 'ஒலியை இயக்கு',
      exit: 'வெளியேறு',
    },
    languageModal: {
      title: 'மொழியினைத் தேர்ந்தெடுக்கவும் / Choose Language',
      subtitle: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்:',
      english: 'English',
      tamil: 'தமிழ்',
    },
    desktopModal: {
      title: 'சிறந்த அனுபவத்திற்கு கணினியைப் பயன்படுத்தவும்',
      message: 'சிறந்த காட்சி மற்றும் ஒலி அனுபவத்திற்கு, கணினி அல்லது பெரிய திரையைப் பயன்படுத்துவது பரிந்துரைக்கப்படுகிறது.',
      button: 'சரி, புரிந்தது',
    },
    confirmExitModal: {
      title: 'இந்த அமர்விலிருந்து வெளியேறவா?',
      message: 'உங்கள் பதிவு அல்லது செய்தி உடனே அழிக்கப்படும். வெளியேறிய பிறகு எதுவும் சேமிக்கப்படாது.',
      confirm: 'வெளியேறி அழி',
      stay: 'தொடர்',
    },
    landing: {
      tagline: 'பேசுங்கள். வெளியிடுங்கள். விட்டுவிடுங்கள்.',
      heading: 'உங்கள் மனதில் உள்ளதை\nதயங்காமல் பேசுங்கள்.',
      subheading: 'மனதில் உள்ள பாரங்களை இறக்கி வைத்து மன அமைதி பெறுவதற்கான ஒரு தனிப்பட்ட இடம்.',
      startBtn: 'தொடங்குங்கள்',
      privacyNote: 'உங்கள் சொற்களும் குரல் பதிவுகளும் இந்தத் தாவலிலேயே இருக்கும்; பதிவேற்றப்படாது. பகுப்பாய்வு இயக்கப்பட்டிருந்தால், பயன்பாட்டை மேம்படுத்த உங்கள் தேர்வுகள் மற்றும் திரை மாற்றங்கள் போன்ற பெயரில்லா பயன்பாட்டு நிகழ்வுகள் அனுப்பப்படலாம்.',
      disclaimer: 'இது ஒரு மன அமைதிக்கான தனிப்பட்ட பயிற்சி மட்டுமே. மருத்துவ உதவிக்கு மாற்றாகாது. மன உளைச்சலில் இருந்தால் தகுந்த உதவியைப் பெறுங்கள்.',
    },
    inputChoice: {
      tagline: 'உங்கள் தனிப்பட்ட பயிற்சி',
      heading: 'எவ்வாறு வெளிப்படுத்த விரும்புகிறீர்கள்?',
      subheading: 'பேசலாம் அல்லது எழுதலாம். எதுவாக இருந்தாலும், பிரவுசரிலேயே இருக்கும் மற்றும் முடிந்ததும் அழிக்கப்படும்.',
      speakTitle: 'பேசுங்கள்',
      speakDesc: 'குரல் பதிவு செய்யுங்கள். எங்கும் பதிவேற்றப்படாது.',
      writeTitle: 'எழுதுங்கள்',
      writeDesc: 'உங்கள் எண்ணங்களை எழுதுங்கள். எங்கும் சேமிக்கப்படாது.',
    },
    typing: {
      tagline: 'எழுதி வையுங்கள்',
      heading: 'வார்த்தைகளாக வெளிப்படுத்துங்கள்.',
      subheading: 'உங்கள் மனதில் உள்ளதை தட்டச்சு செய்யுங்கள். எங்கும் பதிவேற்றப்படாது, சடங்கு முடிந்ததும் அழிக்கப்படும்.',
      inputLabel: 'உங்கள் செய்தி',
      placeholder: 'எழுதத் தொடங்குங்கள்…',
      footNote: 'உங்கள் சொற்கள் காகிதத்தில் தோன்றி, பின்னர் மறைந்துவிடும்.',
      continueBtn: 'தொடரவும்',
      clearBtn: 'அழி',
      backBtn: 'பின்செல்க',
    },
    recording: {
      ready: 'நீங்கள் தயாராகும்போது தொடங்குங்கள்',
      waitingMic: 'மைக்ரோஃபோன் அனுமதியை எதிர்பார்க்கிறது…',
      recording: 'பதிவாகிறது',
      paused: 'நிறுத்தப்பட்டுள்ளது',
      saving: 'செயலாக்கத்தில் உள்ளது…',
      headingActive: 'மனதில் உள்ளதை பேசுங்கள்.',
      headingIdle: 'சுதந்திரமாகப் பேசுங்கள்.',
      privacyNote: 'யாரும் இதை கேட்க மாட்டார்கள். ஆடியோ உங்கள் பிரவுசரிலேயே இருக்கும், எங்கும் பதிவேற்றப்படாது, முடிந்ததும் அழிக்கப்படும்.',
      durationLeft: (left, total) => `${total} நிமிடங்களில் ${left} மீதமுள்ளது`,
      durationLimit: (total) => `வரம்பு ${total} நிமிடங்கள்`,
      micLive: 'மைக் செயலில் உள்ளது',
      resume: 'தொடரவும்',
      pause: 'இடைநிறுத்து',
      stop: 'முடிக்க',
      discard: 'சேமிக்காமல் அழி',
    },
    review: {
      tagline: 'தனிப்பட்ட மறுபார்வை',
      heading: 'நீங்கள் விரும்பினால், கேட்டுப்பாருங்கள்.',
      subheading: 'எந்த எழுத்து மாற்றமும் பகுப்பாய்வும் செய்யப்படுவதில்லை. தயாரானதும் தொடருங்கள்.',
      playLabel: 'பதிவைக் கேள்',
      pauseLabel: 'இடைநிறுத்து',
      hitLimit: (minutes) => `இந்த பதிவு ${minutes} நிமிட வரம்பை அடைந்தது.`,
      playbackUnavailable: 'பிளேபேக் கிடைக்கவில்லை. நீங்கள் தொடரலாம் அல்லது நீக்கலாம்.',
      playbackError: 'ஆடியோவை இயக்க முடியவில்லை. ஸ்பீக்கரை சரிபார்க்கவும்.',
      continueBtn: 'தொடரவும்',
      recordAgain: 'மீண்டும் பதிவுசெய்',
      deleteBtn: 'நீக்கு',
      deleteNotice: 'பதிவு நீக்கப்பட்டது. எதுவும் சேமிக்கப்படவில்லை.',
    },
    choose: {
      tagline: 'வெளியேற்றும் வழியைத் தேர்ந்தெடுக்கவும்',
      heading: 'விட்டுவிடுங்கள்.',
      subheadingVoice: 'இது முடிந்ததும் உங்கள் குரல் பதிவு முற்றிலும் அழிக்கப்படும். ஒன்றைத் தேர்ந்தெடுக்கவும்.',
      subheadingText: 'இது முடிந்ததும் உங்கள் சொற்கள் முற்றிலும் அழிக்கப்படும். ஒன்றைத் தேர்ந்தெடுக்கவும்.',
      burnTitle: 'எரித்தல்',
      burnDesc: 'தாள் கருகி சாம்பலாவதைப் பாருங்கள்.',
      shredTitle: 'துண்டாக்குதல்',
      shredDesc: 'தாள் துண்டு துண்டாக சிதைந்து மறைவதைப் பாருங்கள்.',
      reduceMotion: 'இயக்கத்தைக் குறைக்கவும்',
      backToReview: 'பதிவு பார்வைக்குத் திரும்பு',
      backToTyping: 'மீண்டும் எழுதத் திரும்பு',
    },
    destruction: {
      burnCaption: 'எரிந்து போகட்டும்.',
      shredCaption: 'துண்டாக்கப்படுகிறது.',
      skip: 'அனிமேஷனைத் தவிர்',
    },
    completion: {
      heading: 'எல்லாம் சரியாகிவிடும், விட்டுவிடுங்கள்.',
      subheading: 'ஆழமாக சுவாசியுங்கள். உங்களுக்காக சிறிது நேரம் ஒதுக்குங்கள்.',
      shareBtn: 'பகிர்',
      finish: 'முடிக்க',
      keptNotice: 'நீங்கள் பேசிய அல்லது எழுதிய எதுவும் சேமிக்கப்படவில்லை.',
      takeTime: 'பொறுமையாக இருங்கள்…',
      shareCopied: 'இணைப்பு நகலெடுக்கப்பட்டது!',
      shareTitle: 'விட்டுவிடுங்கள் — பேசுங்கள். வெளியிடுங்கள்.',
      shareText: 'உங்களுக்காகச் சிறிது நேரம் ஒதுக்கி, மனதில் இருப்பதைத் தயக்கமின்றி வெளிப்படுத்தி, நம்பிக்கையுடன் முன்னேறுங்கள்.',
    },
    permission: {
      goBack: 'பின்செல்க',
      tryAgain: 'மீண்டும் முயற்சி செய்க',
      disclaimer: 'மைக்ரோஃபோனை அனுமதித்து பதிவு செய்யும் வரை எதுவும் பதிவு செய்யப்படாது.',
    },
  },
};
