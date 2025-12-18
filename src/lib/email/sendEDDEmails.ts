// EDD Investigation Email Functions
// TODO: Implement these email functions using existing email infrastructure

import { sendEmail } from './ses';
// TODO: Import React Email render function
// import { render } from '@react-email/render';
// TODO: Import email templates when created
// import EDDInvestigationOpenedEmail from '@/emails/EDDInvestigationOpenedEmail';
// import EDDInformationRequestEmail from '@/emails/EDDInformationRequestEmail';
// import EDDCompletionEmail from '@/emails/EDDCompletionEmail';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('EDD_EMAILS')
/**
 * Send email to customer when EDD investigation is opened
 * TODO: Implement this function
 */
export async function sendEDDInvestigationOpenedEmail(
  customerEmail: string,
  customerName: string,
  investigationNumber: string
) {
  logger.log('[TODO] Send EDD investigation opened email to:', customerEmail);
  logger.log('Investigation number:', investigationNumber);

  // TODO: Implement email sending
  // const html = render(EDDInvestigationOpenedEmail({
  //   customerName,
  //   investigationNumber
  // }));
  //
  // return sendEmail({
  //   to: customerEmail,
  //   subject: 'Enhanced Due Diligence Review Required',
  //   html,
  // });

  return Promise.resolve();
}

/**
 * Send email to customer with information request
 * TODO: Implement this function
 */
export async function sendEDDInformationRequestEmail(
  customerEmail: string,
  customerName: string,
  investigationNumber: string,
  requestedItems: string[],
  deadline?: string
) {
  logger.log('[TODO] Send EDD information request email to:', customerEmail);
  logger.log('Requested items:', requestedItems);

  // TODO: Implement email sending
  // const html = render(EDDInformationRequestEmail({
  //   customerName,
  //   investigationNumber,
  //   requestedItems,
  //   deadline
  // }));
  //
  // return sendEmail({
  //   to: customerEmail,
  //   subject: 'Information Required for Your Account Review',
  //   html,
  // });

  return Promise.resolve();
}

/**
 * Send email to customer when investigation is completed
 * TODO: Implement this function
 */
export async function sendEDDCompletionEmail(
  customerEmail: string,
  customerName: string,
  investigationNumber: string,
  decision: 'approved' | 'ongoing_monitoring' | 'enhanced_monitoring' | 'blocked'
) {
  logger.log('[TODO] Send EDD completion email to:', customerEmail);
  logger.log('Decision:', decision);

  // TODO: Implement email sending
  // const html = render(EDDCompletionEmail({
  //   customerName,
  //   investigationNumber,
  //   decision
  // }));
  //
  // return sendEmail({
  //   to: customerEmail,
  //   subject: 'Account Review Completed',
  //   html,
  // });

  return Promise.resolve();
}
