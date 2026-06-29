class DemoHelper {

  constructor(page) {
    this.page = page;
  }

  async injectOverlay() {
    try {
      await this.page.evaluate(() => {

        // Prevent duplicate overlay
        if (document.getElementById('cpq-demo-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'cpq-demo-overlay';

        overlay.innerHTML = `
          <div id="cpq-demo-phase">🚀 SALESFORCE CPQ DEMO</div>
          <div id="cpq-demo-step">Initializing...</div>
        `;

        Object.assign(overlay.style, {

          position: 'fixed',

          // 👇 aur upar le gaye
          top: '14px',

          // 👇 slightly left aligned
          left: '48.5%',

          transform: 'translateX(-50%)',

          // 👇 box thoda bada
          width: '42%',
          minHeight: '72px',

          // 👇 more spacing for text visibility
          padding: '10px 18px',

          background: 'rgba(226, 94, 0, 0.96)',
          border: '2px solid #FF8C00',
          borderRadius: '14px',

          zIndex: '999999',

          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',

          backdropFilter: 'blur(5px)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.24)',

          textAlign: 'center',

          transition: 'all 0.25s ease'
        });

        // Header styling
        const phase = overlay.querySelector('#cpq-demo-phase');

        Object.assign(phase.style, {
          fontSize: '18px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '4px',
          letterSpacing: '0.3px',
          lineHeight: '1.3'
        });

        // 👇 black text more visible
        const step = overlay.querySelector('#cpq-demo-step');

        Object.assign(step.style, {
          fontSize: '15px',
          fontWeight: '700',
          color: '#000000',
          lineHeight: '1.35',
          textShadow: '0 0 1px rgba(255,255,255,0.3)'
        });

        document.body.appendChild(overlay);

      });

    } catch (e) {
      console.log('Overlay inject skipped due to navigation');
    }
  }

  async ensureOverlay() {
    try {
      await this.injectOverlay();
    } catch (e) {
      // Ignore navigation flicker
    }
  }

  async showStep(message, wait = 2000) {

    await this.ensureOverlay();

    try {

      await this.page.evaluate((msg) => {

        const step = document.getElementById('cpq-demo-step');

        if (step) {
          step.innerHTML = `✨ ${msg}`;
        }

      }, message);

    } catch (e) {
      console.log('Step render skipped');
    }

    console.log(`👉 ${message}`);

    await this.page.waitForTimeout(wait);
  }

  async showPhase(title) {

    await this.ensureOverlay();

    try {

      await this.page.evaluate((phaseTitle) => {

        const phase = document.getElementById('cpq-demo-phase');
        const step = document.getElementById('cpq-demo-step');

        if (phase) {
          phase.innerHTML = phaseTitle;
        }

        if (step) {
          step.innerHTML = 'Executing workflow...';
        }

      }, title);

    } catch (e) {
      console.log('Phase render skipped');
    }

    console.log(`🚀 ${title}`);

    await this.page.waitForTimeout(2500);
  }

  async highlightElement(locator) {

    try {

      await locator.evaluate((el) => {

        el.style.transition = 'all 0.25s ease';
        el.style.boxShadow = '0 0 18px #FF8C00';
        el.style.border = '2px solid #FF8C00';
        el.style.position = 'relative';
        el.style.zIndex = '9999';

      });

    } catch (e) {
      console.log('Highlight skipped');
    }

    await this.page.waitForTimeout(800);
  }
}

module.exports = { DemoHelper };