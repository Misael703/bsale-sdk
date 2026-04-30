/** Atributo dinámico configurable por tenant (aplica a clientes, documentos, formas de pago). */
export interface BsaleDynamicAttribute {
  readonly id: number;
  readonly name: string;
  readonly tip: string;
  /** Tipo de control (1=texto, 2=número, 3=fecha, 4=lista — validar con payloads reales). */
  readonly type: number;
  readonly isMandatory: 0 | 1;
  readonly state: 0 | 1;
  readonly payment_type?: { readonly id: string; readonly href: string };
  readonly document_type?: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/dynamic_attributes/{id}/details` (opciones predefinidas). */
export interface BsaleDynamicAttributeDetail {
  readonly id: number;
  readonly name: string;
  readonly state: 0 | 1;
  readonly href: string;
}
