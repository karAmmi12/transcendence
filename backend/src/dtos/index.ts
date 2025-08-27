export class LogiDto {
    constructor( private readonly data: any) {
        
    }
    
    toJson() {
        return this.data.map((d: any) => {
            fistName: this.data.first_name
            lastName: this.data.last_name

        })
    }
 }

 export class RegisterDto {

 }

 export function serialyze (data: any) {
    const newData = Object.entries(data).map(([key, value]) => {
        const newKey = key.split("_").map(n => n.toUpperCase()).join("")
        return {newKey: value};

    })
 }


 //fontion
 export function serialize(data: Record<string, any>) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    // transforme snake_case -> camelCase
    const newKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    acc[newKey] = value;
    return acc;
  }, {} as Record<string, any>);
}

//exwmple
const input = {
  first_name: "Alice",
  last_name: "Dupont",
  user_id: 123
};

const output = serialize(input);

console.log(output);
// { firstName: "Alice", lastName: "Dupont", userId: 123 }
