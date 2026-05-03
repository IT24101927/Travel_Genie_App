import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Polygon, Circle } from 'react-native-svg';
import colors from '../../constants/colors';

const TrendChart = ({ data, color = colors.primary, height = 50, width = 120 }) => {
  if (!data || data.length < 2) return null;

  const P = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = P + (i / (data.length - 1)) * (width - P * 2);
    const y = height - P - ((v - min) / range) * (height - P * 2);
    return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
  });

  const polylinePoints = pts.map(p => p.str).join(' ');
  const polygonPoints = `${P},${height} ${polylinePoints} ${width - P},${height}`;

  const last2 = data.slice(-2);
  const isUp = last2[1] > last2[0];
  const isDown = last2[1] < last2[0];
  const dir = isUp ? '↑' : isDown ? '↓' : '→';
  const dirColor = isUp ? colors.danger : isDown ? colors.success : colors.textMuted;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Polygon
          points={polygonPoints}
          fill="url(#fillGrad)"
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <Circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r="3"
          fill={color}
        />
      </Svg>
      <View style={styles.meta}>
        <Text style={[styles.dirText, { color: dirColor }]}>{dir}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    marginLeft: 8,
  },
  dirText: {
    fontSize: 16,
    fontWeight: '900',
  },
});

export default TrendChart;
