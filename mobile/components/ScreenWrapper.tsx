import { View } from 'react-native';

export default function ScreenWrapper({ children }: any) {
    return (
        <View style={{ flex: 1, paddingBottom: 10 }}>
            {children}
        </View>
    );
}