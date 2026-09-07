import dns from "dns";

// Disposable, temporary, or dummy email domains blacklist
const DISPOSABLE_DOMAINS = new Set([
  "asal.com",
  "test.com",
  "example.com",
  "fake.com",
  "palsu.com",
  "dummy.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
  "getairmail.com",
  "throwaway.com",
  "fakeinbox.com",
  "burnermail.io",
  "mohmal.com",
  "fakemail.net",
  "inboxkitten.com",
  "nada.ltd",
  "getnada.com",
  "dropmail.me",
  "crazymailing.com",
  "tempail.com",
  "dayrep.com",
  "teleworm.us",
  "rhyta.com",
]);

// Common fake / gibberish username patterns
const GIBBERISH_USERNAMES = [
  "asal",
  "test",
  "testing",
  "fake",
  "palsu",
  "dummy",
  "coba",
  "cobaan",
  "contoh",
  "sample",
  "asdf",
  "asdfg",
  "asdfgh",
  "qwerty",
  "qwertyuiop",
  "zxcv",
  "zxcvbnm",
  "12345",
  "123456",
  "12345678",
  "abcdef",
  "qazwsx",
  "random",
  "anonim",
  "anonymous",
];

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  isTrustedDomain?: boolean;
}

export async function validateEmailAddress(email: string): Promise<EmailValidationResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Basic format & length check
  if (!cleanEmail || cleanEmail.length < 6 || cleanEmail.length > 254) {
    return {
      valid: false,
      error: "Panjang email tidak valid (harus antara 6 hingga 254 karakter).",
    };
  }

  // Standard email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.includes("..")) {
    return {
      valid: false,
      error: "Format penulisan email tidak valid. Gunakan format standar seperti nama@gmail.com.",
    };
  }

  const [username, domain] = cleanEmail.split("@");

  if (!username || !domain) {
    return { valid: false, error: "Alamat email tidak lengkap." };
  }

  // 2. Username quality check (avoid keyboard smash and fake names)
  if (username.length < 3) {
    return {
      valid: false,
      error: "Nama akun email (sebelum @) terlalu pendek, minimal 3 karakter.",
    };
  }

  // Reject exact fake matches or prefixes
  const normalizedUsername = username.replace(/[^a-z0-9]/g, "");
  if (GIBBERISH_USERNAMES.includes(normalizedUsername)) {
    return {
      valid: false,
      error: `Nama email '${username}' terdeteksi sebagai email percobaan/asal-asalan. Gunakan email pribadi asli Anda.`,
    };
  }

  // Reject repeating single characters like aaaaaa or 111111
  if (/^(.)\1{3,}$/.test(normalizedUsername)) {
    return {
      valid: false,
      error: "Email mengandung karakter berulang yang terindikasi palsu.",
    };
  }

  // 3. Blacklist check (Disposable & Known Fake Domains)
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: `Domain @${domain} termasuk dalam daftar email sementara/palsu. Gunakan email resmi (Gmail, Yahoo, Outlook, atau email sekolah).`,
    };
  }

  // 4. Check for trusted educational / public mail providers
  const isTrustedDomain =
    domain.endsWith(".sch.id") ||
    domain.endsWith(".ac.id") ||
    domain.endsWith(".kemdikbud.go.id") ||
    ["gmail.com", "yahoo.com", "yahoo.co.id", "outlook.com", "hotmail.com", "icloud.com"].includes(domain);

  // 5. Real DNS MX Record Lookup (Active Mail Server Check)
  try {
    const mxRecords = await Promise.race([
      dns.promises.resolveMx(domain),
      new Promise<dns.MxRecord[]>((_, reject) =>
        setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3000)
      ),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: `Domain @${domain} tidak memiliki server email aktif (MX record). Email ini tidak dapat menerima pesan.`,
      };
    }
  } catch (err: any) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      return {
        valid: false,
        error: `Domain @${domain} tidak terdaftar di internet. Harap periksa ejaan alamat email Anda.`,
      };
    }
    // In case of timeout or offline DNS, allow trusted domains, otherwise warn
    if (!isTrustedDomain) {
      return {
        valid: false,
        error: `Gagal memverifikasi keberadaan domain @${domain}. Gunakan penyedia email umum seperti @gmail.com.`,
      };
    }
  }

  return {
    valid: true,
    isTrustedDomain,
  };
}
