import sanitizeHtml from "sanitize-html";

/**
 * Sanitasi HTML artikel SEBELUM disimpan ke database.
 *
 * Kenapa perlu: konten artikel dirender di frontend dengan
 * dangerouslySetInnerHTML (app/(public)/artikel/[slug]/page.tsx). Tanpa
 * sanitasi, siapa pun yang bisa memanggil endpoint admin artikel -- termasuk
 * penyerang yang berhasil mengambil alih SATU akun admin, atau admin internal
 * yang iseng -- bisa menanam <script> yang jalan di browser SEMUA pengunjung
 * (stored XSS). Di situs anti-penipuan, satu XSS persisten di halaman publik
 * berdampak jauh lebih besar daripada sekadar defacement.
 *
 * Prinsipnya: JANGAN percaya input hanya karena datangnya dari admin.
 * Sanitasi dilakukan di BACKEND (bukan frontend) supaya berlaku untuk semua
 * jalur masuk, termasuk request langsung ke API yang tidak lewat editor.
 *
 * Allowlist di bawah sengaja dibuat pas dengan output editor TipTap yang
 * dipakai admin (StarterKit: heading, paragraf, list, blockquote, code block,
 * bold/italic/strike) ditambah <a> dan <img> yang sudah ada di artikel lama.
 * Jadi tidak ada format sah yang hilang -- yang dibuang cuma hal yang memang
 * tidak pernah diproduksi editor: <script>, <style>, <iframe>, handler
 * on* (onerror/onclick/...), dan URL berskema javascript:.
 */
const ARTICLE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "strong", "b", "em", "i", "s", "u",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a:   ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
  },
  // Hanya skema URL yang aman. Ini yang memblokir javascript:alert(1)
  // dan data:text/html (yang bisa dipakai untuk XSS lewat <a>).
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Link keluar tidak boleh bisa mengakses window.opener milik kita.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
  // Buang isi <script>/<style> sepenuhnya, bukan cuma tag-nya, supaya
  // kode di dalamnya tidak tertinggal sebagai teks mentah.
  nonTextTags: ["script", "style", "textarea", "noscript"],
};

export function sanitizeArticleHtml(html: unknown): string {
  if (typeof html !== "string" || html.length === 0) return "";
  return sanitizeHtml(html, ARTICLE_HTML_OPTIONS);
}

/**
 * Untuk field yang seharusnya teks polos (judul, excerpt). Semua tag dibuang.
 * Judul juga masuk ke JSON-LD & <title> di frontend, jadi tidak boleh ada tag.
 */
export function sanitizePlainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
