export type EventFieldType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'STRUCT';

export type EventField = {
  name: string;
  type: EventFieldType;
  description?: string;
  required?: boolean;
};

export type EventDefinition = {
  name: string;
  displayName: string;
  description?: string;
  fields: EventField[];
  createTime?: string;
  updateTime?: string;
};

export type CreateEventRequest = {
  displayName: string;
  description?: string;
  fields: EventField[];
};

export type TrackEventRequest = {
  eventDefinition: string;
  payload: Record<string, unknown>;
  eventTime?: string;
};

export type ValidateEventRequest = {
  eventDefinition: string;
  payload: Record<string, unknown>;
};

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidateEventResponse = {
  valid: boolean;
  errors?: ValidationError[];
};
