(function() {
  // ===== 配置 =====
  const CONFIG = {
    apiUrl: 'https://fcc-frog-mines-scored.trycloudflare.com',
    botName: '奶爸小助手',
    botAvatar: 'logo-avatar.jpg',
    welcomeMessages: {
      zh: '你好！我是奶爸韩游的AI客服，有什么可以帮到你？\n\n我可以帮你了解：\n• 🎤 演唱会票务 & 专车接送\n• 🏥 韩国医疗观光\n• 🚗 首尔定制包车\n• 🗺️ 首尔一日游路线',
      ko: '안녕하세요! 저는 NB Travel AI 상담원입니다. 무엇을 도와드릴까요?\n\n• 🎤 콘서트 티켓 & 전용차\n• 🏥 의료 관광\n• 🚗 맞춤형 전세버스\n• 🗺️ 서울 당일 투어',
      en: 'Hello! I\'m the NB Travel AI assistant. How can I help you?\n\n• 🎤 Concert tickets & transfers\n• 🏥 Medical tourism\n• 🚗 Custom charter tours\n• 🗺️ Seoul day tours',
    },
    placeholder: {
      zh: '请输入您的问题...',
      ko: '질문을 입력하세요...',
      en: 'Type your question...',
    }
  };

  // ===== 知识库（后期补充）=====
  const KNOWLEDGE = {
    services: [
      '演唱会票务代购、专车接送、应援周边代购',
      '韩国医疗观光：整形、体检、皮肤科',
      '首尔定制包车：半日游、全日游、多日行程',
      '首尔一日游：A线景福宫·北村，B线南山·明洞，C线弘大·梨泰院',
    ],
    contact: '微信：nbtravelkorea | WhatsApp：+82-10-XXXX-XXXX',
    company: '奶爸韩游（NB Travel）是正规注册韩国旅行社，종합여행업 사업자등록번호：106-26-23484',
  };

  // ===== 检测语言 =====
  function detectLang(text) {
    if (/[\uAC00-\uD7A3]/.test(text)) return 'ko';
    if (/[a-zA-Z]{4,}/.test(text) && !/[\u4e00-\u9fff]/.test(text)) return 'en';
    return 'zh';
  }

  // ===== 本地快速回答（无需API）=====
  function quickAnswer(text, lang) {
    const t = text.toLowerCase();
    const answers = {
      zh: {
        '演唱会|concert|공연|票|ticket': '我们提供演唱会全程服务：票务代购 + 专车接送 + 应援周边代购。请告诉我您想看哪场演唱会，我来帮您查询！',
        '医疗|整形|체크업|health|medical': '韩国医疗观光是我们的主打服务之一，包括整形外科、皮肤科、综合体检等。请问您有什么具体需求？',
        '包车|charter|전세|司机': '我们提供首尔及周边定制包车服务，中文司机全程陪同。半日游、全日游均可安排，请问您的行程日期是？',
        '首尔|景点|旅游|tour': '我们有多条首尔一日游路线：A线（景福宫·北村）、B线（南山·明洞）、C线（弘大·梨泰院）。您对哪条路线感兴趣？',
        '价格|多少钱|费用|price|얼마': '具体价格根据行程安排而定，请联系我们的顾问获取报价：微信/WhatsApp 24小时在线！',
        '谢谢|감사|thanks|thank you': '不客气！😊 有任何问题随时找我，祝您韩国行愉快！',
        '联系|contact|微信|wechat|whatsapp|line|라인': '您可以通过以下方式联系我们：\n🟢 LINE：https://line.me/ti/p/K8RyXEQsfg\n我们24小时在线！',
        '你好|hello|안녕|hi|哈喽|嗨': '你好！😊 我是奶爸韩游的AI客服，有什么可以帮到你的？\n\n我可以解答：演唱会票务、医疗观光、包车、首尔游路线等问题，也可以直接联系顾问：微信 nbtravelkorea'
      },
      ko: {
        '콘서트|공연|티켓': '콘서트 티켓 대리 구매, 전용차 픽업, 응원 굿즈 대리 구매 서비스를 제공합니다. 어떤 공연을 원하시나요?',
        '의료|성형|피부': '한국 의료 관광 전문 서비스를 제공합니다. 성형외과, 피부과, 건강검진 등이 포함됩니다.',
        '전세|버스|렌트': '서울 및 근교 맞춤형 전세버스 서비스를 제공합니다. 중국어 가이드 동행 가능합니다.',
      },
      en: {
        'concert|ticket|show': 'We provide full concert services: ticket booking, private transfers, and merchandise purchasing. Which concert are you interested in?',
        'medical|plastic|surgery|skin': 'We specialize in Korean medical tourism including plastic surgery, dermatology, and health checkups.',
        'charter|car|driver|tour': 'We offer customized charter services in Seoul with Mandarin-speaking drivers.',
      }
    };

    const langAnswers = answers[lang] || answers['zh'];
    for (const [pattern, answer] of Object.entries(langAnswers)) {
      if (new RegExp(pattern, 'i').test(text)) {
        return answer;
      }
    }
    return null;
  }

  // ===== 调用 AI API =====
  async function callAPI(messages, lang) {
    const systemPrompt = `你是奶爸韩游（NB Travel）的专业AI客服助手。
公司介绍：${KNOWLEDGE.company}
主要服务：${KNOWLEDGE.services.join('；')}
联系方式：${KNOWLEDGE.contact}

回答规则：
1. 默认用中文回答，但如果用户用韩语提问就用韩语回答，用英语提问就用英语回答
2. 回答要简洁、友好、专业
3. 涉及具体价格时，引导用户联系顾问
4. 不确定的信息不要乱编，说"请联系我们的顾问确认"
5. 每次回答结尾可适当引导用户咨询，但不要每次都重复`;

    try {
      const res = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, systemPrompt }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.reply || '抱歉，暂时无法回答，请直接联系我们的顾问 😊';
    } catch (e) {
      return lang === 'ko'
        ? '죄송합니다, 잠시 후 다시 시도해주세요. 직접 문의: nbtravelkorea'
        : lang === 'en'
        ? 'Sorry, please try again or contact us directly: nbtravelkorea'
        : '抱歉网络有点问题，请稍后重试或直接联系顾问：微信 nbtravelkorea 😊';
    }
  }

  // ===== 创建UI =====
  function createWidget() {
    const style = document.createElement('style');
    style.textContent = `
      /* ===== 浮动按钮 ===== */
      #nb-chat-btn {
        position: fixed;
        bottom: 28px;
        right: 20px;
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #1e3478, #0063CC);
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(30,52,120,.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        transition: transform .2s, box-shadow .2s;
        border: none;
        outline: none;
        overflow: hidden;
        padding: 0;
      }
      #nb-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(30,52,120,.55); }
      #nb-chat-btn img.nb-btn-logo {
        width: 36px; height: 36px;
        object-fit: contain;
        border-radius: 50%;
      }
      #nb-chat-btn .nb-badge {
        position: absolute;
        top: -2px; right: -2px;
        width: 18px; height: 18px;
        background: #FF4D4F;
        border-radius: 50%;
        font-size: 11px;
        color: #fff;
        display: none;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }

      /* ===== 满屏聊天窗口 ===== */
      #nb-chat-window {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: #f0f4fb;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        overflow: hidden;
        transform: translateY(100%);
        opacity: 0;
        transition: transform .35s cubic-bezier(.4,0,.2,1), opacity .25s;
        pointer-events: none;
      }
      #nb-chat-window.open {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      /* ===== Header ===== */
      .nb-chat-header {
        background: #1e3478;
        height: 56px;
        min-height: 56px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        gap: 14px;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0,0,0,.18);
      }
      .nb-avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: rgba(255,255,255,.15);
        display: flex; align-items: center; justify-content: center;
      }
      .nb-avatar img {
        width: 100%; height: 100%;
        object-fit: contain;
        border-radius: 50%;
      }
      .nb-info { flex: 1; min-width: 0; }
      .nb-name { font-weight: 700; font-size: 16px; letter-spacing: .3px; }
      .nb-status { font-size: 12px; opacity: .75; margin-top: 1px; }
      .nb-close {
        margin-left: auto;
        background: rgba(255,255,255,.12);
        border: none;
        color: #fff;
        font-size: 18px;
        cursor: pointer;
        width: 34px; height: 34px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: background .2s;
        flex-shrink: 0;
      }
      .nb-close:hover { background: rgba(255,255,255,.25); }

      /* ===== 消息区域 ===== */
      .nb-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #f0f4fb;
      }
      .nb-msgs-inner {
        max-width: 680px;
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .nb-msg {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        max-width: 78%;
      }
      .nb-msg.bot { align-self: flex-start; }
      .nb-msg.user { align-self: flex-end; flex-direction: row-reverse; }
      .nb-bubble {
        padding: 13px 18px;
        border-radius: 20px;
        font-size: 15px;
        line-height: 1.75;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .nb-msg.bot .nb-bubble {
        background: #fff;
        color: #1a1a1a;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 6px rgba(0,0,0,.07);
      }
      .nb-msg.user .nb-bubble {
        background: linear-gradient(135deg, #1e3478, #0063CC);
        color: #fff;
        border-bottom-right-radius: 4px;
        box-shadow: 0 2px 8px rgba(30,52,120,.3);
      }
      .nb-bot-icon {
        width: 34px; height: 34px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: #fff;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,.1);
      }
      .nb-bot-icon img {
        width: 30px; height: 30px;
        object-fit: contain;
        border-radius: 50%;
      }
      .nb-typing {
        display: flex; gap: 5px; align-items: center;
        padding: 14px 18px;
        background: #fff;
        border-radius: 20px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,.07);
      }
      .nb-typing span {
        width: 7px; height: 7px;
        background: #bbb;
        border-radius: 50%;
        animation: nb-bounce .9s ease-in-out infinite;
      }
      .nb-typing span:nth-child(2) { animation-delay: .15s; }
      .nb-typing span:nth-child(3) { animation-delay: .3s; }
      @keyframes nb-bounce {
        0%,80%,100% { transform: translateY(0); opacity: .4; }
        40% { transform: translateY(-6px); opacity: 1; }
      }

      /* ===== 输入区域 ===== */
      .nb-chat-input-wrap {
        background: #fff;
        border-top: 1px solid #e8ecf2;
        padding: 14px 16px 24px;
        flex-shrink: 0;
      }
      .nb-quick-btns {
        display: flex; gap: 8px; flex-wrap: wrap;
        max-width: 680px;
        margin: 0 auto 12px;
      }
      .nb-quick-btn {
        font-size: 13px;
        padding: 7px 16px;
        border: 1.5px solid #1e3478;
        color: #1e3478;
        background: #f0f3fa;
        border-radius: 20px;
        cursor: pointer;
        white-space: nowrap;
        transition: all .2s;
        font-family: inherit;
      }
      .nb-quick-btn:hover { background: #1e3478; color: #fff; }
      .nb-chat-input {
        max-width: 680px;
        margin: 0 auto;
        display: flex;
        gap: 10px;
      }
      .nb-chat-input input {
        flex: 1;
        border: 1.5px solid #dde3ee;
        border-radius: 26px;
        padding: 13px 22px;
        font-size: 15px;
        outline: none;
        transition: border-color .2s, box-shadow .2s;
        font-family: inherit;
        background: #f7f9fd;
        color: #1a1a1a;
      }
      .nb-chat-input input:focus {
        border-color: #1e3478;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(30,52,120,.08);
      }
      .nb-chat-input button {
        width: 48px; height: 48px;
        background: linear-gradient(135deg, #1e3478, #0063CC);
        border: none;
        border-radius: 50%;
        color: #fff;
        font-size: 18px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: opacity .2s, transform .15s;
        box-shadow: 0 3px 10px rgba(30,52,120,.35);
      }
      .nb-chat-input button:hover { opacity: .88; transform: scale(1.05); }
      .nb-chat-input button:disabled { opacity: .45; cursor: not-allowed; transform: none; }

      @media (max-width: 480px) {
        .nb-chat-messages { padding: 16px 12px; }
        .nb-msg { max-width: 90%; }
        .nb-chat-input-wrap { padding: 12px 12px 20px; }
      }
    `;
    document.head.appendChild(style);


    // 按钮
    const btn = document.createElement('button');
    btn.id = 'nb-chat-btn';
    btn.innerHTML = '<img src="logo-icon-light.jpg" class="nb-btn-logo" alt="AI客服"><div class="nb-badge" id="nb-badge">1</div>';
    btn.title = 'AI客服';
    document.body.appendChild(btn);

    // 窗口
    const win = document.createElement('div');
    win.id = 'nb-chat-window';
    win.innerHTML = `
      <div class="nb-chat-header">
        <div class="nb-avatar"><img src="logo-icon-light.jpg" alt="奶爸小助手"></div>
        <div class="nb-info">
          <div class="nb-name">奶爸小助手</div>
          <div class="nb-status">● 在线 · 24小时服务</div>
        </div>
        <button class="nb-close" id="nb-chat-close">✕</button>
      </div>
      <div class="nb-chat-messages" id="nb-chat-msgs"></div>
      <div class="nb-chat-input-wrap">
      <div class="nb-quick-btns" id="nb-quick-btns">
        <button class="nb-quick-btn">🎤 演唱会票务</button>
        <button class="nb-quick-btn">🏥 医疗观光</button>
        <button class="nb-quick-btn">🚗 定制包车</button>
        <button class="nb-quick-btn">📞 联系顾问</button>
      </div>
      <div class="nb-chat-input">
        <input type="text" id="nb-chat-input" placeholder="请输入您的问题..." maxlength="200" />
        <button id="nb-chat-send">➤</button>
      </div>
      </div>
    `;
    document.body.appendChild(win);

    return { btn, win };
  }

  // ===== 初始化逻辑 =====
  function init() {
    const { btn, win } = createWidget();
    const msgs = document.getElementById('nb-chat-msgs');
    const input = document.getElementById('nb-chat-input');
    const sendBtn = document.getElementById('nb-chat-send');
    const closeBtn = document.getElementById('nb-chat-close');
    const badge = document.getElementById('nb-badge');
    const quickBtns = document.querySelectorAll('.nb-quick-btn');

    let isOpen = false;
    let isTyping = false;
    let history = []; // [{role, content}]
    let currentLang = 'zh';
    let welcomed = false;

    window.nbToggleChat = function() {
      toggleChat();
    };
    function toggleChat() {
      isOpen = !isOpen;
      win.classList.toggle('open', isOpen);
      btn.innerHTML = isOpen
        ? '<span style="color:#fff;font-size:20px;line-height:1;">✕</span><div class="nb-badge" id="nb-badge" style="display:none">1</div>'
        : '<img src="logo-icon-light.jpg" class="nb-btn-logo" alt="AI客服"><div class="nb-badge" id="nb-badge" style="display:none">1</div>';
      if (isOpen && !welcomed) {
        welcomed = true;
        setTimeout(() => addMsg('bot', CONFIG.welcomeMessages[currentLang]), 400);
      }
      if (isOpen) { input.focus(); badge.style.display = 'none'; }
    }

    function addMsg(role, text) {
      const div = document.createElement('div');
      div.className = `nb-msg ${role}`;
      if (role === 'bot') {
        div.innerHTML = `<div class="nb-bot-icon"><img src="logo-icon-light.jpg" alt="bot"></div><div class="nb-bubble">${text}</div>`;
      } else {
        div.innerHTML = `<div class="nb-bubble">${text}</div>`;
      }
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'nb-msg bot';
      div.id = 'nb-typing-indicator';
      div.innerHTML = `<div class="nb-bot-icon"><img src="logo-icon-light.jpg" alt="bot"></div><div class="nb-typing"><span></span><span></span><span></span></div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById('nb-typing-indicator');
      if (el) el.remove();
    }

    async function send(text) {
      if (!text.trim() || isTyping) return;
      text = text.trim();
      input.value = '';
      sendBtn.disabled = true;
      isTyping = true;

      // 检测语言
      currentLang = detectLang(text);

      // 更新placeholder
      const placeholders = CONFIG.placeholder;
      input.placeholder = placeholders[currentLang] || placeholders.zh;

      addMsg('user', text);
      history.push({ role: 'user', content: text });

      showTyping();

      // 先尝试本地快速回答
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      const quick = quickAnswer(text, currentLang);

      let reply;
      if (quick) {
        reply = quick;
      } else {
        // 调用 API
        try {
          reply = await callAPI(history.slice(-8), currentLang);
        } catch(e) {
          reply = '抱歉，暂时无法连接，请直接联系顾问 💬';
        }
      }

      hideTyping();
      addMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });

      sendBtn.disabled = false;
      isTyping = false;
      input.focus();
    }

    // 事件绑定
    btn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', () => send(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });
    quickBtns.forEach(b => {
      b.addEventListener('click', () => send(b.textContent.replace(/^[^\s]+\s/, '').trim() || b.textContent));
    });

    // 3秒后显示提示红点
    setTimeout(() => {
      if (!isOpen) {
        badge.style.display = 'flex';
        btn.innerHTML = '<img src="logo-icon-light.jpg" class="nb-btn-logo" alt="AI客服"><div class="nb-badge" id="nb-badge" style="display:flex">1</div>';
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
