export namespace UsersConfig {
  export const ACCOUNT_CREATION_INVITE_MAX_AGE =
    parseInt(process.env.ACCOUNT_CREATION_INVITE_MAX_AGE ?? "86400") || 86400;
}
