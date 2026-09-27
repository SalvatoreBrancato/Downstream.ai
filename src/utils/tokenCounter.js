let encoderPromise;

function getEncoder() {
  if (!encoderPromise) {
    encoderPromise = Promise.all([
      import("js-tiktoken/lite"),
      import("js-tiktoken/ranks/o200k_base"),
    ])
      .then(([{ Tiktoken }, { default: ranks }]) => new Tiktoken(ranks))
      .catch((error) => {
        encoderPromise = null;
        throw error;
      });
  }
  return encoderPromise;
}

export async function countTokens(text) {
  if (!text) return 0;
  const encoder = await getEncoder();
  return encoder.encode(text).length;
}
