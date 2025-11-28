import { motion } from "motion/react";
import type { SVGProps } from "react";

interface MocahLoadingIconProps
  extends Omit<
    SVGProps<SVGSVGElement>,
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
    | "onDragStart"
    | "onDragEnd"
    | "onDrag"
    | "values"
    | "width"
    | "height"
  > {
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { width: 140, height: 108 },
  md: { width: 210, height: 162 },
  lg: { width: 280, height: 216 },
} as const;

const MocahLoadingIcon = ({
  isLoading = true,
  size = "md",
  ...props
}: MocahLoadingIconProps) => {
  const dimensions = sizeMap[size];
  // Assembly animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const pillarVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const squareVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
      },
    },
  };

  // Breathing pulse animation (starts after assembly)
  const breathingVariants = {
    breathe: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.85, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 0.8, // Delay to allow assembly to complete
      },
    },
  };

  return (
    <motion.svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 210 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={breathingVariants}
      animate={isLoading ? "breathe" : undefined}
      {...props}
    >
      <motion.g
        id="MocahIcon"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <g id="Group">
          {/* Left Pillar */}
          <motion.g variants={pillarVariants}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M51.3496 135.681V128.935H14.9964V135.681H51.3496Z"
              className="fill-[#808080] dark:fill-[#333333]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M51.3496 127.061V116.942H14.9964V127.061H51.3496Z"
              className="fill-[#666666] dark:fill-[#4D4D4D]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M51.3496 115.069V103.076H14.9964V115.069H51.3496Z"
              className="fill-[#4D4D4D] dark:fill-[#666666]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M51.3496 101.202V86.9604H14.9964V101.202H51.3496Z"
              className="fill-[#333333] dark:fill-[#999999]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M51.3496 85.0865V67.4721H14.9964V85.0865H51.3496Z"
              className="fill-[#1A1A1A] dark:fill-[#cccccc]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.9964 27.3712V65.2235H85.8289L66.3406 27.3712C49.1009 27.3712 32.2361 27.3712 14.9964 27.3712Z"
              className="fill-foreground"
            />
          </motion.g>

          {/* Center V-Shape */}
          <motion.g variants={pillarVariants}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M121.058 135.681L124.431 128.935H83.955L87.328 135.681H95.573H121.058Z"
              className="fill-[#808080] dark:fill-[#333333]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M125.555 127.061L130.802 116.942H77.9586L82.8307 127.061H125.555Z"
              className="fill-[#666666] dark:fill-[#4D4D4D]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M131.926 115.069L137.923 103.076H70.8379L76.8343 115.069H131.926Z"
              className="fill-[#4D4D4D] dark:fill-[#666666]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M103.818 101.202L96.6974 86.9604H62.5928L69.7136 101.202H103.818Z"
              className="fill-[#333333] dark:fill-[#999999]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M95.573 85.0865L86.5784 67.4721H52.4739L61.4685 85.0865H95.573Z"
              className="fill-[#1A1A1A] dark:fill-[#cccccc]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M122.182 67.4721L112.813 85.0865H146.917L156.287 67.4721H122.182Z"
              className="fill-[#1A1A1A] dark:fill-[#cccccc]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M112.063 86.9604L104.568 101.202H138.672L146.168 86.9604H112.063Z"
              className="fill-[#333333] dark:fill-[#999999]"
            />
          </motion.g>

          {/* Right Pillar */}
          <motion.g variants={pillarVariants}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M194.139 135.681V128.935H157.786V135.681H194.139Z"
              className="fill-[#808080] dark:fill-[#333333]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M194.139 127.061V116.942H157.786V127.061H194.139Z"
              className="fill-[#666666] dark:fill-[#4D4D4D]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M194.139 115.069V103.076H157.786V115.069H194.139Z"
              className="fill-[#4D4D4D] dark:fill-[#666666]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M194.139 101.202V86.9604H157.786V101.202H194.139Z"
              className="fill-[#333333] dark:fill-[#999999]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M194.139 85.0865V67.4721H157.786V85.0865H194.139Z"
              className="fill-[#1A1A1A] dark:fill-[#cccccc]"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M142.42 27.3712L122.932 65.2235C146.917 65.2235 170.153 65.2235 194.139 65.2235V27.3712C176.899 27.3712 159.66 27.3712 142.42 27.3712Z"
              className="fill-foreground"
            />
          </motion.g>

          {/* Decorative Squares - animate last */}
          <motion.g variants={squareVariants}>
            <path
              d="M12.5523 21H9V24.5523H12.5523V21Z"
              className="fill-foreground"
            />
            <path
              d="M106.246 21H102.694V24.5523H106.246V21Z"
              className="fill-foreground"
            />
            <path
              d="M200.315 21H196.762V24.5523H200.315V21Z"
              className="fill-foreground"
            />
            <path
              d="M200.315 79.8397H196.762V83.392H200.315V79.8397Z"
              className="fill-foreground"
            />
            <path
              d="M12.5523 79.8397H9V83.392H12.5523V79.8397Z"
              className="fill-foreground"
            />
            <path
              d="M12.5523 138.305H9V141.857H12.5523V138.305Z"
              className="fill-foreground"
            />
            <path
              d="M106.246 138.305H102.694V141.857H106.246V138.305Z"
              className="fill-foreground"
            />
            <path
              d="M200.315 138.305H196.762V141.857H200.315V138.305Z"
              className="fill-foreground"
            />
            <path
              d="M156.661 125.562H158.91H159.285V125.937V128.186V128.56H158.91H156.661H156.287V128.186V125.937V125.562H156.661ZM158.91 125.937H157.036V127.811H158.91V125.937Z"
              className="fill-foreground"
            />
            <path
              d="M156.661 134.557H158.91H159.285V134.932V137.18V137.555H158.91H156.661H156.287V137.18V134.932V134.557H156.661ZM158.91 134.932H157.036V136.806H158.91V134.932Z"
              className="fill-foreground"
            />
            <path
              d="M156.661 113.569H158.91H159.285V113.944V116.193V116.568H158.91H156.661H156.287V116.193V113.944V113.569H156.661ZM158.91 113.944H157.036V115.818H158.91V113.944Z"
              className="fill-foreground"
            />
            <path
              d="M156.661 99.7028H158.91H159.285V100.078V102.326V102.701H158.91H156.661H156.287V102.326V100.078V99.7028H156.661ZM158.91 100.078H157.036V101.951H158.91V100.078Z"
              className="fill-foreground"
            />
            <path
              d="M156.661 83.9622H158.91H159.285V84.337V86.5856V86.9604H158.91H156.661H156.287V86.5856V84.337V83.9622H156.661ZM158.91 84.337H157.036V86.2109H158.91V84.337Z"
              className="fill-foreground"
            />
            <path
              d="M13.8721 125.562H16.1207H16.4955V125.937V128.186V128.56H16.1207H13.8721H13.4973V128.186V125.937V125.562H13.8721ZM16.1207 125.937H14.2469V127.811H16.1207V125.937Z"
              className="fill-foreground"
            />
            <path
              d="M13.8721 134.557H16.1207H16.4955V134.932V137.18V137.555H16.1207H13.8721H13.4973V137.18V134.932V134.557H13.8721ZM16.1207 134.932H14.2469V136.806H16.1207V134.932Z"
              className="fill-foreground"
            />
            <path
              d="M13.8721 113.569H16.1207H16.4955V113.944V116.193V116.568H16.1207H13.8721H13.4973V116.193V113.944V113.569H13.8721ZM16.1207 113.944H14.2469V115.818H16.1207V113.944Z"
              className="fill-foreground"
            />
            <path
              d="M13.8721 99.7028H16.1207H16.4955V100.078V102.326V102.701H16.1207H13.8721H13.4973V102.326V100.078V99.7028H13.8721ZM16.1207 100.078H14.2469V101.951H16.1207V100.078Z"
              className="fill-foreground"
            />
            <path
              d="M13.8721 83.9622H16.1207H16.4955V84.337V86.5856V86.9604H16.1207H13.8721H13.4973V86.5856V84.337V83.9622H13.8721ZM16.1207 84.337H14.2469V86.2109H16.1207V84.337Z"
              className="fill-foreground"
            />
            <path
              d="M81.7064 125.562H83.955H84.3298V125.937V128.186V128.56H83.955H81.7064H81.3316V128.186V125.937V125.562H81.7064ZM83.955 125.937H82.0812V127.811H83.955V125.937Z"
              className="fill-foreground"
            />
            <path
              d="M86.2037 134.557H88.4523H88.8271V134.932V137.18V137.555H88.4523H86.2037H85.8289V137.18V134.932V134.557H86.2037ZM88.4523 134.932H86.5785V136.806H88.4523V134.932Z"
              className="fill-foreground"
            />
            <path
              d="M75.71 113.569H77.9586H78.3334V113.944V116.193V116.568H77.9586H75.71H75.3352V116.193V113.944V113.569H75.71ZM77.9586 113.944H76.0848V115.818H77.9586V113.944Z"
              className="fill-foreground"
            />
            <path
              d="M64.8415 26.2469H67.0902H67.4649V26.6216V28.8703V29.2451H67.0902H64.8415H64.4667V28.8703V26.6216V26.2469H64.8415ZM67.0902 26.6216H65.2163V28.4955H67.0902V26.6216Z"
              className="fill-foreground"
            />
            <path
              d="M85.4541 65.973H87.7028H88.0775V66.3478V68.5964V68.9712H87.7028H85.4541H85.0793V68.5964V66.3478V65.973H85.4541ZM87.7028 66.3478H85.8289V68.2217H87.7028V66.3478Z"
              className="fill-foreground"
            />
            <path
              d="M95.573 85.8361H97.8217H98.1965V86.2109V88.4595V88.8343H97.8217H95.573H95.1983V88.4595V86.2109V85.8361H95.573ZM97.8217 86.2109H95.9478V88.0847H97.8217V86.2109Z"
              className="fill-foreground"
            />
            <path
              d="M111.688 83.9622H113.937H114.312V84.337V86.5856V86.9604H113.937H111.688H111.314V86.5856V84.337V83.9622H111.688ZM113.937 84.337H112.063V86.2109H113.937V84.337Z"
              className="fill-foreground"
            />
            <path
              d="M103.443 99.7028H105.692H106.067V100.078V102.326V102.701H105.692H103.443H103.069V102.326V100.078V99.7028H103.443ZM105.692 100.078H103.818V101.951H105.692V100.078Z"
              className="fill-foreground"
            />
            <path
              d="M193.015 26.2469H195.263H195.638V26.6216V28.8703V29.2451H195.263H193.015H192.64V28.8703V26.6216V26.2469H193.015ZM195.263 26.6216H193.389V28.4955H195.263V26.6216Z"
              className="fill-foreground"
            />
            <path
              d="M103.443 78.3406L106.816 81.7136L106.067 82.8379L102.319 79.0902L103.443 78.3406Z"
              className="fill-foreground"
            />
            <path
              d="M106.816 79.0902L103.443 82.8379L102.319 81.7136L106.067 78.3406L106.816 79.0902Z"
              className="fill-foreground"
            />
          </motion.g>
        </g>
      </motion.g>
    </motion.svg>
  );
};

export default MocahLoadingIcon;