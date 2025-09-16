import { BaseSkill } from '../BaseSkill';
import { SkillParams, SkillResult, SkillCategory } from '../../types';

export class DiscountCalculatorSkill extends BaseSkill {
  metadata = {
    id: 'discount-calculator',
    name: 'Discount Calculator',
    description: 'Calculates discounts, taxes, and final prices with coupon support',
    category: SkillCategory.ECOMMERCE,
    version: '1.0.0',
    author: 'Intelagent Platform'
  };

  validate(params: SkillParams): boolean {
    return true;
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { 
      originalPrice = 0, 
      discounts = [], 
      quantity = 1, 
      taxRate = 0.08,
      shipping = 0 
    } = params;
    
    console.log(`[DiscountCalculatorSkill] Calculating discounts for $${originalPrice}`);
    
    let currentPrice = originalPrice * quantity;
    const appliedDiscounts: any[] = [];
    
    // Apply discounts
    discounts.forEach((discount: any) => {
      const discountAmount = discount.type === 'percentage' 
        ? currentPrice * (discount.value / 100)
        : discount.value;
      
      appliedDiscounts.push({
        ...discount,
        amount: discountAmount,
        applied: true
      });
      
      currentPrice -= discountAmount;
    });
    
    const subtotal = currentPrice;
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shipping;
    const totalSavings = (originalPrice * quantity) - subtotal;
    
    const data = {
      calculation: {
        originalPrice: originalPrice * quantity,
        quantity,
        subtotal,
        discounts: appliedDiscounts,
        totalDiscount: totalSavings,
        discountPercentage: ((totalSavings / (originalPrice * quantity)) * 100).toFixed(2),
        tax: {
          rate: taxRate,
          amount: tax
        },
        shipping,
        total,
        savings: totalSavings
      },
      breakdown: {
        perUnit: {
          original: originalPrice,
          discounted: subtotal / quantity,
          savings: totalSavings / quantity
        },
        bulk: quantity > 1 ? {
          threshold: 10,
          additionalDiscount: quantity >= 10 ? '5%' : '0%',
          nextTier: quantity < 10 ? `Buy ${10 - quantity} more for bulk discount` : null
        } : null
      },
      coupons: {
        available: [
          {
            code: 'SAVE10',
            description: '10% off your order',
            type: 'percentage',
            value: 10,
            minPurchase: 50
          },
          {
            code: 'FREESHIP',
            description: 'Free shipping',
            type: 'shipping',
            value: shipping,
            minPurchase: 75
          }
        ],
        suggested: totalSavings < 20 ? 'SAVE10' : null
      },
      comparison: {
        withoutDiscounts: originalPrice * quantity + tax + shipping,
        withDiscounts: total,
        percentageSaved: ((totalSavings / (originalPrice * quantity)) * 100).toFixed(2) + '%'
      }
    };

    return this.success(data);
  }
}