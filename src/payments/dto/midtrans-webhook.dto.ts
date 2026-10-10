import { IsOptional, IsString } from 'class-validator';

export class MidtransWebhookDto {
  @IsString()
  order_id: string;

  @IsString()
  status_code: string;

  @IsString()
  gross_amount: string;

  @IsString()
  signature_key: string;

  @IsString()
  transaction_status: string;

  @IsOptional()
  @IsString()
  fraud_status?: string;

  @IsOptional()
  @IsString()
  transaction_id?: string;

  @IsOptional()
  @IsString()
  payment_type?: string;

  @IsOptional()
  @IsString()
  transaction_time?: string;

  @IsOptional()
  @IsString()
  settlement_time?: string;

  @IsOptional()
  @IsString()
  expiry_time?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
