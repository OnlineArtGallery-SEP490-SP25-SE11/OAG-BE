import { z } from 'zod';

export const subscribePremiumSchema = z.object({
  // Không cần các trường khác vì chúng ta sẽ sử dụng giá cố định và thanh toán từ ví người dùng
});

export const cancelPremiumSchema = z.object({
  // Không cần các trường vì chúng ta chỉ cần xác thực người dùng
}); 