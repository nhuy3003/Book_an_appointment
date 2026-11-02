/**
 * cache.js — RAM cache đơn giản dùng Map thuần
 */
const DEFAULT_TTL_MS = 30 * 1000; // 30 giây

// Mỗi entry: { value, expiresAt }
const store = new Map();

/**
 * Lấy giá trị từ cache.
 * @returns {*} value hoặc null nếu không có / đã hết hạn
 */
const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  console.log(`[cache] HIT  → ${key}`);
  return entry.value;
};

/**
 * Ghi giá trị vào cache.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlMs] - thời gian sống tính bằng milliseconds
 */
const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  console.log(`[cache] SET  → ${key} (TTL ${ttlMs / 1000}s)`);
};

/**
 * Xóa một key cụ thể.
 */
const del = (key) => {
  if (store.has(key)) {
    store.delete(key);
    console.log(`[cache] DEL  → ${key}`);
  }
};

/**
 * Xóa tất cả key có prefix nhất định.
 * Dùng khi cần invalidate theo doctorId, ví dụ: delByPattern("slots:5:")
 * @param {string} prefix
 */
const delByPattern = (prefix) => {
  let count = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      count++;
    }
  }
  if (count > 0) {
    console.log(`[cache] DEL  → pattern "${prefix}*" (${count} keys)`);
  }
};

/**
 * Xóa toàn bộ cache (dùng khi cần reset hoàn toàn).
 */
const flush = () => {
  const size = store.size;
  store.clear();
  console.log(`[cache] FLUSH → cleared ${size} entries`);
};

module.exports = { get, set, del, delByPattern, flush };
