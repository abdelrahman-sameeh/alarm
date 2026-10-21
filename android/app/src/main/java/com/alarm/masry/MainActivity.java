package com.alarm.masry;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmSoundsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
