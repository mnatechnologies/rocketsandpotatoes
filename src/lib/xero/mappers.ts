import {
  Contact,
  Address,
  Invoice,
  LineItem,
  Item,
  Payment,
  CurrencyCode,
  LineAmountTypes,
} from 'xero-node';
import { Product } from '@/types/product';

const XERO_REVENUE_ACCOUNT_CODE = process.env.XERO_REVENUE_ACCOUNT_CODE || '200';
const XERO_BANK_ACCOUNT_CODE = process.env.XERO_BANK_ACCOUNT_CODE || '090';

interface CustomerData {
  first_name: string;
  last_name: string;
  email: string;
  residential_address?: {
    address_line_1?: string;
    address_line_2?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface BusinessCustomerData {
  abn?: string;
}

interface TransactionData {
  id: string;
  amount_aud: number;
  created_at: string;
  product_details?: {
    items?: CartItem[];
  };
}

interface CartItem {
  quantity: number;
  price: number;
  name: string;
  product?: {
    name?: string;
    weight?: string;
    metal_type?: string;
    slug?: string;
    id?: string;
    calculated_price?: number;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function mapCustomerToXeroContact(
  customer: CustomerData,
  businessCustomer?: BusinessCustomerData
): Contact {
  const contact: Contact = {
    name: `${customer.first_name} ${customer.last_name}`,
    firstName: customer.first_name,
    lastName: customer.last_name,
    emailAddress: customer.email,
  };

  if (customer.residential_address) {
    const addr = customer.residential_address;
    const address: Address = {
      addressType: Address.AddressTypeEnum.STREET,
      addressLine1: addr.address_line_1,
      addressLine2: addr.address_line_2,
      city: addr.suburb,
      region: addr.state,
      postalCode: addr.postcode,
      country: addr.country || 'Australia',
    };
    contact.addresses = [address];
  }

  if (businessCustomer?.abn) {
    contact.taxNumber = businessCustomer.abn;
  }

  return contact;
}

export function mapTransactionToXeroInvoice(
  transaction: TransactionData,
  xeroContactId: string,
  lineItems: LineItem[]
): Invoice {
  const dateStr = formatDate(transaction.created_at);

  return {
    type: Invoice.TypeEnum.ACCREC,
    contact: { contactID: xeroContactId },
    date: dateStr,
    dueDate: dateStr,
    reference: transaction.id,
    status: Invoice.StatusEnum.AUTHORISED,
    currencyCode: CurrencyCode.AUD,
    lineAmountTypes: LineAmountTypes.Exclusive,
    lineItems,
  };
}

export function mapCartItemToXeroLineItem(
  cartItem: CartItem,
  xeroItemCode?: string
): LineItem {
  const productName = cartItem.product?.name || cartItem.name || 'Product';
  const weight = cartItem.product?.weight || '';
  const metalType = cartItem.product?.metal_type || '';

  const descriptionParts = [productName];
  if (weight) descriptionParts.push(weight);
  if (metalType) descriptionParts.push(metalType);

  const lineItem: LineItem = {
    description: descriptionParts.join(' - '),
    quantity: cartItem.quantity,
    unitAmount: cartItem.price,
    accountCode: XERO_REVENUE_ACCOUNT_CODE,
    taxType: 'EXEMPTOUTPUT',
  };

  if (xeroItemCode) {
    lineItem.itemCode = xeroItemCode;
  }

  return lineItem;
}

export function mapProductToXeroItem(product: Product): Item {
  return {
    code: (product.slug || product.id).substring(0, 30),
    name: product.name.substring(0, 50),
    description: product.description?.substring(0, 4000),
    isSold: true,
    salesDetails: {
      unitPrice: product.calculated_price ?? product.price,
      accountCode: XERO_REVENUE_ACCOUNT_CODE,
      taxType: 'EXEMPTOUTPUT',
    },
  };
}

export function mapPaymentForInvoice(
  invoiceId: string,
  amount: number,
  date: string
): Payment {
  return {
    invoice: { invoiceID: invoiceId },
    account: { code: XERO_BANK_ACCOUNT_CODE },
    amount,
    date: formatDate(date),
  };
}
