/**
 * Thêm mã màu ANSI vào văn bản được cung cấp.
 *
 * @param {string} text - Văn bản cần thêm màu.
 * @param {string} color - Mã màu ANSI để áp dụng.
 * @returns {string} - Văn bản đã được thêm màu.
 *
 * @example
 * console.log(colorize('Đây là văn bản màu xanh lá cây', '32')); // Văn bản màu xanh lá cây
 * console.log(colorize('Đây là văn bản màu đỏ', '31')); // Văn bản màu đỏ
 *
 * Mã màu ANSI:
 * 30 - Đen
 * 31 - Đỏ
 * 32 - Xanh lá cây
 * 33 - Vàng
 * 34 - Xanh dương
 * 35 - Tím
 * 36 - Xanh dương nhạt
 * 37 - Trắng
 */
const colorize = (text: string, color: string): string =>
	`\x1b[${color}m${text}\x1b[0m`;

export { colorize };
