import {View, Text} from "react-native";
import {Link} from "expo-router";

const login = () => {
    return (
        <View>
            <Text className="text-xl font-bold text-primary">Sign In Page</Text>
            <Link href="/(auth)/login">Login to Account</Link>
        </View>
    )
}

export default login;