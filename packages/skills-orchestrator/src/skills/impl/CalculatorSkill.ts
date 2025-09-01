/**
 * Calculator Skill
 * Performs basic mathematical calculations
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';

export class CalculatorSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'calculator',
    name: 'Calculator',
    description: 'Performs mathematical calculations',
    category: SkillCategory.UTILITY,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['math', 'calculation', 'utility'],
    examples: [
      {
        description: 'Add two numbers',
        params: { operation: 'add', a: 5, b: 3 }
      },
      {
        description: 'Calculate expression',
        params: { expression: '(5 + 3) * 2' }
      }
    ]
  };
  
  validate(params: SkillParams): boolean {
    if (params.expression) {
      return typeof params.expression === 'string';
    }
    
    if (params.operation) {
      const validOps = ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'];
      return validOps.includes(params.operation);
    }
    
    return false;
  }
  
  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      this.log('Executing calculation');
      
      if (!this.validate(params)) {
        return this.error('Invalid parameters. Provide either expression or operation with numbers.');
      }
      
      let result: number;
      
      if (params.expression) {
        // Safe expression evaluation (only allows numbers and basic operators)
        const sanitized = params.expression.replace(/[^0-9+\-*/().\s]/g, '');
        if (sanitized !== params.expression) {
          return this.error('Invalid characters in expression. Only numbers and +, -, *, /, (, ) are allowed.');
        }
        
        try {
          // Using Function constructor for safe math evaluation
          result = new Function('return ' + sanitized)();
        } catch (err) {
          return this.error('Invalid expression format');
        }
      } else {
        const { operation, a, b } = params;
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        
        if (isNaN(numA) || (operation !== 'sqrt' && isNaN(numB))) {
          return this.error('Invalid numbers provided');
        }
        
        switch (operation) {
          case 'add':
            result = numA + numB;
            break;
          case 'subtract':
            result = numA - numB;
            break;
          case 'multiply':
            result = numA * numB;
            break;
          case 'divide':
            if (numB === 0) {
              return this.error('Division by zero');
            }
            result = numA / numB;
            break;
          case 'power':
            result = Math.pow(numA, numB);
            break;
          case 'sqrt':
            if (numA < 0) {
              return this.error('Cannot calculate square root of negative number');
            }
            result = Math.sqrt(numA);
            break;
          default:
            return this.error('Unknown operation');
        }
      }
      
      return this.success({
        result,
        formatted: result.toLocaleString(),
        params
      });
      
    } catch (error: any) {
      this.log(`Calculation error: ${error.message}`, 'error');
      return this.error(`Calculation failed: ${error.message}`);
    }
  }
}