/** Configure before importing components, just as with MUI's className entry. */
let generateComponentClassName = (componentName: string) => componentName;
export const unstable_ClassNameGenerator = {
  configure(generator: (componentName: string) => string) {
    generateComponentClassName = generator;
  },
  generate(componentName: string) {
    return generateComponentClassName(componentName);
  },
  reset() {
    generateComponentClassName = (componentName: string) => componentName;
  },
};
