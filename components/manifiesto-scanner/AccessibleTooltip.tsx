import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface AccessibleTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  accessible?: boolean;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  children,
  content,
  position = 'top',
  accessible = true
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);

  const showTooltip = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        
        let tooltipX = pageX;
        let tooltipY = pageY;
        
        switch (position) {
          case 'top':
            tooltipX = pageX + width / 2;
            tooltipY = pageY - 10;
            break;
          case 'bottom':
            tooltipX = pageX + width / 2;
            tooltipY = pageY + height + 10;
            break;
          case 'left':
            tooltipX = pageX - 10;
            tooltipY = pageY + height / 2;
            break;
          case 'right':
            tooltipX = pageX + width + 10;
            tooltipY = pageY + height / 2;
            break;
        }
        
        // Ajustar si se sale de la pantalla
        if (tooltipX < 10) tooltipX = 10;
        if (tooltipX > screenWidth - 200) tooltipX = screenWidth - 200;
        if (tooltipY < 10) tooltipY = 10;
        if (tooltipY > screenHeight - 100) tooltipY = screenHeight - 100;
        
        setTooltipPosition({ x: tooltipX, y: tooltipY });
        setVisible(true);
      });
    }
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        onPress={showTooltip}
        onLongPress={showTooltip}
        onPressOut={hideTooltip}
        accessible={accessible}
        accessibilityRole="button"
        accessibilityLabel={`Información adicional: ${content}`}
        accessibilityHint="Toca para mostrar información de ayuda"
        style={styles.trigger}
      >
        {children}
      </TouchableOpacity>
      
      {visible && (
        <View
          style={[
            styles.tooltip,
            {
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }
          ]}
          accessibilityRole="tooltip"
          accessibilityLabel={content}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.tooltipText}>{content}</Text>
          <View style={[styles.arrow, getArrowStyle(position)]} />
        </View>
      )}
    </>
  );
};

const getArrowStyle = (position: string) => {
  switch (position) {
    case 'top':
      return {
        bottom: -5,
        left: '50%',
        marginLeft: -5,
        borderTopColor: '#333',
        borderTopWidth: 5,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    case 'bottom':
      return {
        top: -5,
        left: '50%',
        marginLeft: -5,
        borderBottomColor: '#333',
        borderBottomWidth: 5,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
      };
    case 'left':
      return {
        right: -5,
        top: '50%',
        marginTop: -5,
        borderLeftColor: '#333',
        borderLeftWidth: 5,
        borderTopWidth: 5,
        borderBottomWidth: 5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      };
    case 'right':
      return {
        left: -5,
        top: '50%',
        marginTop: -5,
        borderRightColor: '#333',
        borderRightWidth: 5,
        borderTopWidth: 5,
        borderBottomWidth: 5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      };
    default:
      return {};
  }
};

const styles = StyleSheet.create({
  trigger: {
    // El trigger no debe tener estilos que interfieran con el contenido
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    maxWidth: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    lineHeight: 16,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});