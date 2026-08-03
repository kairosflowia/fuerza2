export interface OrderEmailPort{orderConfirmed(orderId:string):Promise<boolean>;paymentFailed(orderId:string):Promise<boolean>;orderCancelled(orderId:string):Promise<boolean>;orderReady(orderId:string):Promise<boolean>}
export const orderEmails:OrderEmailPort={orderConfirmed:async()=>false,paymentFailed:async()=>false,orderCancelled:async()=>false,orderReady:async()=>false};
