// header.js
const headerHTML = `
  <div id="main-header-wrapper">
    <div class="w-full bg-[#333333] flex items-center justify-between px-4" style="height: 24px;">
      <span class="text-white" style="font-size: 6pt; letter-spacing: 0.5px;">FTR3MD's</span>
      <nav class="flex items-center space-x-3">
        <a href="index.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Home</a>
        <a href="flights.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Flights</a>
        <a href="#" class="text-white hover:text-gray-300" style="font-size: 6pt;">Schedule</a>
      </nav>
    </div>
    <nav aria-label="Breadcrumb" class="w-full px-4 py-2 border-b border-gray-100">
      <ol id="breadcrumb" class="flex items-center space-x-2" style="font-size: 6pt; color: #888; text-transform: uppercase;"></ol>
    </nav>
  </div>
`;

const footerHTML = `
  <footer id="main-footer" class="w-full bg-[#333333] py-6 mt-10 text-center">
    <div class="text-white font-bold" style="font-size: 8pt;">FTR3MD's DIRECTORY</div>
    <div class="text-gray-400 mt-1" style="font-size: 6pt;">© 2026 ALL RIGHTS RESERVED</div>
  </footer>
`;

// ฟังก์ชันนี้มีไว้เพื่อให้หน้า HTML ที่เรียก injectHeader() ไม่ Error
function injectHeader() {
    const existing = document.getElementById('main-header-wrapper');
    if (existing) existing.remove();
    const headerElement = document.createElement('div');
    headerElement.innerHTML = headerHTML;
    document.body.prepend(headerElement);
}

// ฟังก์ชันฉีด Layout ทั้งหมด (Header + Footer)
function injectLayout() {
    injectHeader(); // ใส่ Header
    
    // ใส่ Footer
    const existingFooter = document.getElementById('main-footer');
    if (!existingFooter) {
        const footerElement = document.createElement('div');
        footerElement.innerHTML = footerHTML;
        document.body.appendChild(footerElement);
    }
}

// จัดการ Favicon และสั่งรัน layout ทันทีที่โหลด
// ในส่วนของ (function() { ... }) ของ header.js

(function() {
    // 1. เคลียร์ Favicon
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach(icon => icon.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'about:blank';
    document.head.appendChild(link);

    // 2. CSS บังคับโครงสร้าง
    const style = document.createElement('style');
    style.innerHTML = `
        /* ทำให้ body สูงเต็มจอเสมอ และวาง Footer ไว้ล่างสุด */
        html, body {
            height: 100% !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
        }
        
        /* สั่งให้ body ยืดหยุ่น */
        body {
            min-height: 100vh !important;
        }

        /* ตรงนี้สำคัญ: บังคับให้ส่วนเนื้อหาหลักขยายตัวจนเต็มพื้นที่ */
        /* เราใช้ selector เป็น * เพื่อครอบคลุมทุกหน้า */
        body > div:not(#main-footer):not(#main-header-wrapper) {
            flex: 1 !important;
        }

        /* ตรึง Footer ไว้ล่างสุดเสมอ */
        #main-footer {
            margin-top: auto !important;
            flex-shrink: 0 !important;
        }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', injectLayout);
})();
