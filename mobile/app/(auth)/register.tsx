import {View, Text} from "react-native";
import {Link} from "expo-router";

const register = () => {
    return (
        <View>
            <Text className="text-xl font-bold text-primary">Sign In Page</Text>
            <Link href="/(auth)/register">Create Account</Link>
        </View>
    )
}

export default register;